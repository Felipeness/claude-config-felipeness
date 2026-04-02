---
name: nestjs
description: NestJS standards for type-safe, maintainable backend services. Use when writing NestJS controllers, services, modules, guards, interceptors, or microservices.
user_invocable: true
---

# NestJS Standards

Build NestJS services that scream the domain, not the framework. Type-safe, testable, observable.

## Module Organization

### One Module per Bounded Context
Modules map to domain boundaries, not technical layers. A `PaymentModule` owns its controllers, services, repositories, and types — not a `ControllersModule` with every controller in the app.

```
src/
  payment/
    payment.module.ts
    payment.controller.ts
    payment-query.service.ts
    payment-command.service.ts
    payment.repository.ts
    payment.schema.ts          # Zod schemas for boundary validation
    payment.types.ts            # Domain types, DTOs
    payment.controller.test.ts
    payment-command.service.test.ts
```

### Module Boundaries
- Module dependencies explicit via `imports` array — no ambient/global providers
- Export only what other modules consume — hide internal services
- Direct imports between files within a module (no barrel files inside modules)
- Barrel exports (`index.ts`) only at module boundary for the public API surface
- `forwardRef` only as last resort for circular deps — restructure first (extract shared module)

### Global Modules
- Sparingly: `ConfigModule`, `LoggerModule`, `HealthModule`
- Never for business logic — if everything depends on it, the boundary is wrong

## Providers & Dependency Injection

### Constructor Injection
```typescript
export class PaymentCommandService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}
}
```

### Interface Segregation in DI
Define interfaces at the consumer, not the provider. The consumer declares what it needs:

```typescript
// payment-command.service.ts — consumer defines the contract
type PaymentPersistence = {
  save(payment: Payment): Promise<Payment>
  findById(id: PaymentId): Promise<Payment | null>
}

export class PaymentCommandService {
  constructor(
    @Inject('PaymentPersistence')
    private readonly persistence: PaymentPersistence,
  ) {}
}
```

Don't create 1:1 interface-per-class for "testability" — only extract an interface when there are multiple implementations or the boundary genuinely benefits from abstraction.

### Custom Providers
```typescript
// Complex initialization via useFactory
{
  provide: 'REDIS_CLIENT',
  useFactory: (config: ConfigService<EnvSchema>) => {
    return new Redis({
      host: config.get('REDIS_HOST', { infer: true }),
      port: config.get('REDIS_PORT', { infer: true }),
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
    })
  },
  inject: [ConfigService],
}
```

## Controllers

### Thin Controllers
Controllers are boundaries — they validate input, delegate to services, and shape output. Zero business logic.

```typescript
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandService: PaymentCommandService,
    private readonly queryService: PaymentQueryService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreatePaymentSchema)) input: CreatePaymentInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaymentDto> {
    const payment = await this.commandService.create({
      ...input,
      userId: req.user.id,
    })
    return toPaymentDto(payment)
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentDto> {
    const payment = await this.queryService.findById(id as PaymentId)
    if (!payment) throw new NotFoundException(`payment ${id}`)
    return toPaymentDto(payment)
  }
}
```

### Boundary Validation with Zod
Parse don't validate. Zod schemas at the controller boundary, trust types internally.

```typescript
const CreatePaymentSchema = z.object({
  amount: z.number().positive().int(),
  currency: z.enum(['BRL', 'USD']),
  recipientId: z.string().uuid(),
})

type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>

// Reusable pipe
export class ZodValidationPipe<T extends z.ZodSchema> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }
    return result.data
  }
}
```

### Controller Rules
- Return DTOs, never entities — entities are internal, DTOs are the API contract
- Use mapper functions (`toPaymentDto`) instead of class-transformer decorators
- One endpoint, one schema — don't reuse create schema for update
- Explicit response types — no implicit `any` leaking from service returns
- Never spread `req.body` into database operations — allowlist fields explicitly

## Services

### CQS: Separate Reads from Writes
For complex domains, split into query and command services. Simpler domains can use a single service.

```typescript
// Query service — reads, no side effects
export class PaymentQueryService {
  constructor(private readonly repo: PaymentRepository) {}

  async findById(id: PaymentId): Promise<Payment | null> {
    return this.repo.findById(id)
  }

  async listByUser(userId: UserId, cursor?: string): Promise<Paginated<Payment>> {
    return this.repo.listByUser(userId, { cursor, limit: 50 })
  }
}

// Command service — writes, side effects at the edges
export class PaymentCommandService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async create(input: CreatePaymentInput & { userId: UserId }): Promise<Payment> {
    const payment = Payment.create(input)
    const saved = await this.repo.save(payment)
    this.eventBus.emit('payment.created', { paymentId: saved.id })
    return saved
  }
}
```

### Functional Core / Imperative Shell
Pure business rules in standalone functions or static methods. Services orchestrate I/O around them.

```typescript
// Pure — no I/O, easily testable
function calculateFee(amount: number, tier: CustomerTier): number {
  const rates = {
    standard: 0.029,
    premium: 0.019,
    enterprise: 0.009,
  } as const satisfies Record<CustomerTier, number>
  return Math.round(amount * rates[tier])
}

// Imperative shell — service orchestrates I/O
async process(paymentId: PaymentId): Promise<Payment> {
  const payment = await this.repo.findById(paymentId)
  if (!payment) throw new NotFoundException(`payment ${paymentId}`)

  const customer = await this.customerService.findById(payment.customerId)
  const fee = calculateFee(payment.amount, customer.tier) // pure call

  return this.repo.update(paymentId, { fee, status: 'processed' })
}
```

### Error Handling in Services
- Result/Either for expected business errors — the caller decides how to handle
- Throw only for system errors (DB down, network failure)
- Domain exceptions extend `HttpException` for auto-mapping to HTTP codes

```typescript
// Domain exception with context
export class PaymentAlreadyProcessedException extends ConflictException {
  constructor(paymentId: PaymentId) {
    super(`payment ${paymentId}: already processed`)
  }
}

// Result type for business outcomes
type PaymentResult =
  | { ok: true; payment: Payment }
  | { ok: false; reason: 'insufficient_funds' | 'invalid_recipient' | 'duplicate' }
```

## Guards, Interceptors, Pipes

### Execution Order
Guards -> Interceptors -> Pipes -> Handler -> Interceptors (response)

### Guards (AuthN / AuthZ)
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    return requiredRoles.some((role) => request.user.roles.includes(role))
  }
}
```

### Interceptors (Cross-Cutting Concerns)
```typescript
// Logging with timing — applied globally
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest()
    const { method, url } = req
    const start = performance.now()

    return next.handle().pipe(
      tap(() => {
        const durationMs = Math.round(performance.now() - start)
        this.logger.log('Request completed', { method, url, durationMs })
      }),
    )
  }
}
```

### Pipes
- Use for validation/transformation at boundary
- Zod pipes for body validation
- `ParseUUIDPipe`, `ParseIntPipe` for params
- Custom pipes for domain-specific parsing (branded types)

```typescript
// Parse raw string into branded type
@Injectable()
export class ParsePaymentIdPipe implements PipeTransform<string, PaymentId> {
  transform(value: string): PaymentId {
    if (!isValidUuid(value)) {
      throw new BadRequestException(`invalid payment ID: ${value}`)
    }
    return value as PaymentId
  }
}
```

## Error Handling

### Global Exception Filter
Consistent error shape across the entire application:

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const { status, body } = this.mapException(exception)

    if (status >= 500) {
      this.logger.error('Unhandled exception', {
        path: request.url,
        method: request.method,
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      })
    }

    response.status(status).json(body)
  }

  private mapException(exception: unknown): { status: number; body: ApiError } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse()
      return {
        status: exception.getStatus(),
        body: typeof response === 'string'
          ? { code: 'ERROR', message: response }
          : response as ApiError,
      }
    }

    return {
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    }
  }
}
```

### Error Context
- Errors carry the operation context without "failed to" stacking
- `"create payment: insufficient funds"` not `"failed to create payment: failed to charge: insufficient funds"`

## Configuration

### Typed Config with Zod
```typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string().min(32),
  EXTERNAL_API_TIMEOUT_MS: z.coerce.number().default(5000),
})

type EnvSchema = z.infer<typeof EnvSchema>

// In AppModule
ConfigModule.forRoot({
  validate: (config) => EnvSchema.parse(config),
  isGlobal: true,
})
```

### Typed Access
```typescript
// Generic ConfigService for inferred types
constructor(private readonly config: ConfigService<EnvSchema, true>) {}

// Access with inference — no runtime errors from typos
const timeout = this.config.get('EXTERNAL_API_TIMEOUT_MS', { infer: true })
```

## Microservices

### Transport-Agnostic Handlers
```typescript
@Controller()
export class PaymentEventHandler {
  constructor(private readonly commandService: PaymentCommandService) {}

  @EventPattern('order.completed')
  async handleOrderCompleted(
    @Payload() event: OrderCompletedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef()
    const message = context.getMessage()

    try {
      await this.commandService.processOrderPayment(event, {
        idempotencyKey: event.id,
      })
      channel.ack(message)
    } catch (error) {
      // Requeue on transient errors, dead-letter on permanent
      const requeue = isTransientError(error)
      channel.nack(message, false, requeue)
    }
  }
}
```

### ClientProxy Calls
```typescript
// Explicit timeouts on all remote calls
async notifyBilling(paymentId: PaymentId): Promise<void> {
  const result = await firstValueFrom(
    this.billingClient.send('billing.charge', { paymentId }).pipe(
      timeout(5000),
      retry({ count: 3, delay: (attempt) => timer(2 ** attempt * 1000) }),
    ),
  )
  return result
}
```

### Idempotency
Every write operation must be idempotent:
```typescript
async processPayment(input: ProcessPaymentInput): Promise<Payment> {
  const existing = await this.repo.findByIdempotencyKey(input.idempotencyKey)
  if (existing) return existing

  const payment = await this.repo.save(Payment.create(input))
  return payment
}
```

## Testing

### Unit Tests — Pure Business Logic
```typescript
describe('calculateFee', () => {
  const cases = [
    { amount: 10000, tier: 'standard' as const, expected: 290 },
    { amount: 10000, tier: 'premium' as const, expected: 190 },
    { amount: 10000, tier: 'enterprise' as const, expected: 90 },
    { amount: 0, tier: 'standard' as const, expected: 0 },
  ] as const

  it.each(cases)(
    'returns $expected for $tier tier on $amount',
    ({ amount, tier, expected }) => {
      expect(calculateFee(amount, tier)).toBe(expected)
    },
  )
})
```

### Integration Tests — Services with Real Dependencies
```typescript
describe('PaymentCommandService', () => {
  let service: PaymentCommandService
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PaymentModule, TestDatabaseModule],
    }).compile()

    service = module.get(PaymentCommandService)
  })

  afterAll(() => module.close())

  it('creates payment and emits event', async () => {
    const input = buildCreatePaymentInput({ amount: 5000 })
    const result = await service.create(input)

    expect(result.amount).toBe(5000)
    expect(result.status).toBe('pending')
  })

  it('rejects duplicate idempotency key', async () => {
    const input = buildCreatePaymentInput({ idempotencyKey: 'key-1' })
    await service.create(input)

    const result = await service.create(input)
    expect(result.id).toBe(result.id) // same payment returned
  })
})
```

### E2E Tests
```typescript
describe('POST /payments', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ZodValidationPipe(CreatePaymentSchema))
    await app.init()
  })

  afterAll(() => app.close())

  it('returns 400 for invalid input', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({ amount: -1 })
      .expect(400)

    expect(response.body.code).toBe('VALIDATION_ERROR')
  })
})
```

### Test Naming
Verbs in 3rd person, no "should":
- `createsPaymentWithValidInput`
- `rejectsDuplicateIdempotencyKey`
- `returns404ForMissingPayment`
- `appliesPremiumFeeRate`

### Test Location
Colocated with source: `payment-command.service.test.ts` next to `payment-command.service.ts`.

## Performance

### Fastify Adapter
Use Fastify over Express for throughput-critical services:
```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
)
```

### Lazy-Loaded Modules
For large apps, defer module initialization:
```typescript
@Module({})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {}
}

// In router module
const AdminModule = () => import('./admin/admin.module').then((m) => m.AdminModule)

@Module({
  imports: [RouterModule.register([{ path: 'admin', module: AdminModule }])],
})
export class AppRoutingModule {}
```

### Connection Pooling
Explicit pool config — never trust ORM defaults:
```typescript
// Prisma
datasources: {
  db: { url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=10' }
}

// TypeORM
TypeOrmModule.forRoot({
  extra: { max: 20, connectionTimeoutMillis: 5000 },
})
```

### Caching
```typescript
// Cache keys named by query, not entity
@Injectable()
export class PaymentQueryService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async findById(id: PaymentId): Promise<Payment | null> {
    const cacheKey = `payment:by-id:${id}`
    const cached = await this.cache.get<Payment>(cacheKey)
    if (cached) return cached

    const payment = await this.repo.findById(id)
    if (payment) await this.cache.set(cacheKey, payment, 60_000)
    return payment
  }
}
```

## Health Checks

Every NestJS service exposes health endpoints:
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.redis.pingCheck('redis', {
        transport: Transport.REDIS,
        options: { host: 'localhost', port: 6379 },
        timeout: 3000,
      }),
    ])
  }
}
```

## NestJS 11 Specifics

### SWC as Default Compiler
NestJS 11 uses SWC by default for faster builds. Ensure `@swc/core` and `@swc/cli` are in devDependencies.

### Vitest as Default Test Runner
NestJS 11 defaults to Vitest. Use `@nestjs/testing` with Vitest conventions:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
```

### JSON Logging via ConsoleLogger
```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({ json: true, logLevels: ['log', 'warn', 'error'] }),
})
```

### Bootstrap without AppModule
For microservices that don't need the full HTTP stack:
```typescript
const app = await NestFactory.createMicroservice(OrdersModule, {
  transport: Transport.RMQ,
  options: { urls: [rmqUrl], queue: 'orders' },
})
await app.listen()
```

### unwrap() on Microservice Clients
NestJS 11 adds `unwrap()` for cleaner error handling on client proxies:
```typescript
const result = await this.billingClient
  .send('billing.charge', payload)
  .pipe(timeout(5000))
  .toPromise()
  .then(unwrap) // throws typed error instead of silent failure
```

## Anti-Patterns to Avoid

- **Fat controllers**: Business logic belongs in services, controllers just wire I/O
- **God modules**: A module importing 20 other modules signals broken boundaries
- **Circular dependencies**: Restructure, don't `forwardRef` your way out
- **Global providers for business services**: Only infrastructure is global
- **class-validator + class-transformer magic**: Prefer Zod — explicit, composable, type-inferred
- **Decorators for business rules**: Decorators are metadata, not business logic
- **`@Inject` with string tokens everywhere**: Use class references when possible, string tokens only for interfaces
- **Testing with mocks for everything**: Mock what you don't control, fake what you do
- **`any` in DI tokens or generics**: Every provider has a type
- **No timeout on ClientProxy calls**: Every remote call gets an explicit timeout
- **Swallowing errors in event handlers**: Always ack/nack explicitly, log failures
- **`SELECT *` without LIMIT**: Every query to a list endpoint must be paginated
