---
name: comment-style
description: Guia de tom e vocabulário para comentários de code review em PRs. Use automaticamente ao escrever comentários inline ou summaries em pull requests. Garante que os comentários soem humanos, gentis, tecnicamente sofisticados e livres de padrões robóticos de IA.
user_invocable: true
---

# Code Review Comments

Guia de como escrever comentários de code review. Não é um checklist de análise (para isso use `ultrathink-review` ou `review-changes`). É o guia de **como comunicar** os achados depois que a análise já foi feita.

> *"Qualquer tolo pode escrever código que um computador entende. Bons programadores escrevem código que humanos entendem."*

## Princípios de tom

O comentário de review é uma conversa entre colegas. Não é um relatório, não é um ticket, não é um template. Quem lê precisa sentir que um ser humano escreveu aquilo pensando especificamente naquele trecho de código.

**Gentileza com substância.** Ser gentil não é ser vago. É ser direto sem ser rude. Elogiar com especificidade, sugerir com contexto, discordar com argumentos.

**Severidade implícita.** O peso da frase carrega a prioridade. "Essa parte me preocupou" comunica mais urgência que "Nit:". Não precisa de labels como 🔴🟡🟢 ou [BLOCKING]. O leitor entende pelo tom.

**Parcimônia nas palavras.** Cada frase precisa justificar sua existência. Se o ponto cabe em duas linhas, não escreva cinco. Verbosidade dilui o impacto.

**Empatia com o autor.** Antes de apontar um problema, reconheça a intenção. O autor tomou uma decisão com as informações que tinha. Pergunte antes de afirmar quando não tiver certeza.

### Como falar

- Texto corrido conversacional, sem headers formatados nos comentários inline
- Português brasileiro natural com gramática correta e acentuação impecável
- Elogios genuínos e específicos, nunca genéricos
- Sugestões como pedido, não como ordem
- Perguntas quando há dúvida legítima
- Code snippets quando a sugestão é tangível
- Conectar com o contexto do projeto quando relevante

### Exemplos de tom

Elogio específico:
```
Gostei da extração do compressToZip — isola bem a responsabilidade
e elimina a duplicação entre os dois services. Ficou coeso.
```

Sugestão gentil com impacto:
```
Sem timeout explícito aqui, o pod fica à mercê do serviço externo.
Se a Meta demorar pra responder, essa request congela e o worker
trava. Um deadline de 30s já protege contra esse cenário.
```

Pergunta legítima:
```
Essa remoção da auth no socket foi intencional? Antes exigia
checkToken antes do join. Se o frontend resolve isso de outra
forma que eu não estou vendo, me corrige que aí está safe.
```

Nit curto e direto:
```
Nit: esse require do logger ficou inline dentro do método —
provavelmente sobrou de um debug. Mover pro topo mantém a coesão.
```

Fora do escopo mas vale mencionar:
```
Fora do escopo deste PR, mas já que você está nessa área: o bloco
de custom type logo abaixo não tem a mesma proteção. Se quiser
aplicar uma guard parecida, ótimo — mas sem pressão, pode ser
num PR separado.
```

## O que nunca fazer (anti-patterns de IA)

### Palavras e expressões proibidas

Estas palavras entregam imediatamente que uma máquina escreveu. Nunca usar em comentários de review:

| Proibido | Por quê |
|---|---|
| "Certamente", "Com certeza" | Nenhum humano abre um review assim |
| "É importante notar que" | Filler burocrático |
| "Vamos explorar", "Vamos mergulhar" | Tom de apresentação corporativa |
| "Robusto", "Abrangente", "Holístico" | Buzzwords vazias |
| "Aproveitar" (no sentido de leverage) | Anglicismo forçado |
| "Garantir que" (ensure that) | Tradução literal do inglês |
| "Implementar" como verbo genérico | Prefira verbos específicos: extrair, isolar, mover |
| "Basicamente", "Essencialmente" | Filler que não adiciona nada |
| "Eu recomendaria", "Eu sugeriria" | Condicional desnecessário, seja direto |
| "Por favor considere" | Formalidade excessiva entre colegas |

### Padrões estruturais proibidos

| Proibido | Por quê |
|---|---|
| Headers com `###` nos comentários inline | Comentário de review não é documento |
| Emojis como labels de severidade (🔴🟡🟢) | Template robótico |
| Bullet lists de "Impacto / Sugestão / Fix" | Parece gerado por ferramenta |
| Travessões longos — no meio de frases — assim | Cacoete de IA, use vírgulas ou ponto |
| "**Sugestão:**", "**Impacto:**", "**Fix:**" | Labels de template |
| Repetir o que o código faz antes de comentar | O autor sabe o que escreveu |
| Começar com "Boa observação!" quando ninguém observou nada | Elogio falso |

### Gramática e coesão

- Acentuação correta sempre: é, está, não, será, código, módulo, específico
- Coerência no registro: se começou informal, mantenha informal
- Coesão entre as frases: cada frase conecta com a anterior
- Sem misturar português e inglês desnecessariamente (termos técnicos em inglês são aceitáveis quando não têm tradução natural: callback, middleware, hot path)
- Concordância verbal e nominal impecável

## Vocabulário técnico refinado

Usar estes termos quando encaixarem naturalmente. Nunca forçar.

### Substantivos e conceitos

| Termo | Significado no contexto de review |
|---|---|
| Semântica | O significado por trás da implementação |
| Parcimônia | Simplicidade, fazer mais com menos |
| Verbosidade | Excesso de código desnecessário |
| Ergonomia (da API) | Facilidade de uso para o consumidor |
| Legibilidade | Clareza na leitura do código |
| Entropia | Desordem crescente no codebase |
| Regressão | Quebra de funcionalidade previamente funcional |
| Efeito colateral | Mudança de estado não intencional |
| Invariante | Condição que deve sempre ser verdadeira |
| Heurística | Abordagem prática, não necessariamente ótima |
| Coesão | Grau em que os elementos de um módulo pertencem juntos |
| Acoplamento | Dependência entre módulos |
| Contrapressão (backpressure) | Quando o produtor não respeita a capacidade do consumidor |
| Degradação graciosa | Falhar de forma controlada |
| Idempotência | Executar múltiplas vezes produz o mesmo resultado |
| Síncope | Eliminação de algo redundante ou intermediário |

### Adjetivos técnicos

| Termo | Uso |
|---|---|
| Declarativo vs Imperativo | Diga o quê, não como |
| Agnóstico | Independente de tecnologia ou plataforma |
| Transitório | Temporário, passageiro |
| Canônico | A forma padrão ou oficial |
| Opaco vs Transparente | Visibilidade interna do componente |
| Preguiçoso (lazy) | Avaliação sob demanda |
| Volátil | Sujeito a mudanças frequentes |
| Hermético | Completamente isolado do ambiente externo |
| Ubíquo | Presente em toda parte (linguagem ubíqua do DDD) |

## Frases de referência por categoria

Usar como inspiração, não como template. Adaptar ao contexto.

### Arquitetura e design

- "Essa abstração viola o princípio da menor surpresa"
- "O acoplamento temporal entre esses dois serviços pode ser traiçoeiro em produção"
- "A granularidade desse módulo ficou inadequada, é candidato a uma extração"
- "O contrato dessa interface está implícito demais"
- "Essa indireção não está pagando seu custo"
- "A coesão desse módulo ficou diluída, ele sabe demais sobre coisas que não são responsabilidade dele"
- "O domínio está sangrando para a camada de infraestrutura"
- "Isso viola a Lei de Deméter"
- "Essa herança cria um acoplamento que a composição resolveria com mais parcimônia"
- "O nível de abstração está inconsistente, mistura orquestração com detalhe de implementação"

### Performance e escala

- "Essa heurística funciona agora mas o comportamento assintótico é preocupante"
- "Existe uma condição de corrida latente aqui"
- "Sem paginação isso é uma bomba relógio para tenants com alto volume"
- "Uma avaliação preguiçosa evitaria esse custo upfront"
- "O hot path está pagando por uma operação que podia ser diferida"
- "A contenção nesse lock pode virar gargalo sob concorrência"
- "Sem degradação graciosa, qualquer falha externa cascateia para cá"
- "Isso é fundamentalmente um problema de contrapressão"

### Segurança e resiliência

- "Existe uma janela de vulnerabilidade entre o check e o act, clássico TOCTOU"
- "Esse input cruza a fronteira de confiança sem validação"
- "O princípio do menor privilégio sugere restringir essa permissão"
- "Sem timeout explícito, isso fica à mercê do serviço externo"
- "O fallback silencioso mascara o problema, a entropia do sistema aumenta sem visibilidade"
- "Essa superfície de ataque é desnecessariamente ampla"

### Legibilidade e semântica

- "O nome não carrega a semântica da operação"
- "Podemos tornar isso mais idiomático"
- "Essa verbosidade esconde a intenção"
- "A negação dupla aumenta a carga cognitiva"
- "Esse comentário explica o quê, mas o código deveria falar por si, o que falta é o porquê"
- "O nível de abstração está inconsistente"
- "Esse nome é opaco, não revela a invariante que protege"

### Erros e observabilidade

- "O erro sobe sem contexto da operação"
- "Engolir esse erro silenciosamente é perigoso, a entropia cresce sem visibilidade"
- "A mensagem de erro é voltada para o desenvolvedor, não para o usuário"
- "Sem correlação entre esses logs, rastrear o fluxo em produção vai ser arqueologia"
- "Esse catch genérico trata cenários de negócio e erros de infraestrutura da mesma forma"

### Testes e qualidade

- "Esse teste valida o caminho feliz mas não exercita a invariante que o código protege"
- "A cobertura é boa, mas falta o cenário de contorno"
- "Esse mock acopla o teste à implementação, qualquer refactor interno quebra o teste sem mudar o comportamento"
- "O teste é hermético? Se rodar em paralelo com outro, compartilham estado?"
- "Falta idempotência, rodar esse teste duas vezes seguidas dá resultado diferente"

## Design patterns como vocabulário

Referenciar patterns quando agregam valor ao argumento. Não citar por citar.

| Pattern | Quando referenciar |
|---|---|
| Tell Don't Ask | Caller acessando internals para tomar decisão |
| TOCTOU (Time of Check to Time of Use) | Race condition entre verificação e ação |
| Strangler Fig | Migração incremental de código legado |
| Circuit Breaker | Falta de proteção contra falhas em cascata |
| Parse Don't Validate | Input cruzando fronteira sem tipagem |
| Functional Core / Imperative Shell | Mistura de lógica pura com side effects |
| Strategy / Policy | Cadeia de if/else que podia ser extensível |
| Repository | Acesso a dados vazando para camada de negócio |
| Saga | Transação distribuída sem compensação |
| Bulkhead | Falha em um componente contaminando outros |

Exemplo de uso natural:
```
Aqui o caller precisa conhecer a estrutura interna do order
para chegar no endereço de entrega. Clássico Tell Don't Ask:
order.shippingCity() em vez de order.getCustomer().getAddress().getCity().
```

## Citações

Usar esporadicamente no summary do review, quando encaixar naturalmente no contexto. Nunca forçar. Uma citação por review no máximo.

Formato:
```
> *"Texto da citação."*
```

### Simplicidade e parcimônia

> *"A perfeição é alcançada não quando não há mais nada a adicionar, mas quando não há mais nada a remover."*

> *"Tudo deve ser feito da forma mais simples possível, mas não mais simples que isso."*

> *"Simplicidade é a sofisticação definitiva."*

### Clareza e comunicação

> *"O maior problema da comunicação é a ilusão de que ela aconteceu."*

> *"A brevidade é a alma da sagacidade."*

> *"Escreva com clareza. Se o pensamento é turvo, a escrita será turva."*

### Arquitetura e design

> *"A arquitetura grita o propósito do sistema."*

> *"O todo é mais do que a soma das partes, mas as partes são mais do que fragmentos do todo."*

> *"Existem apenas dois problemas difíceis em ciência da computação: invalidação de cache e nomear coisas."*

### Qualidade e disciplina

> *"Cuidado com bugs no código acima; eu apenas provei que está correto, não testei."*

> *"Primeiro faça funcionar, depois faça bonito, depois faça rápido."*

> *"O código que você escreve faz duas coisas: conta para o computador o que fazer e conta para o próximo programador o que você queria fazer."*

### Humildade e perspectiva

> *"Debugar é duas vezes mais difícil que escrever código. Portanto, se você escrever o código da forma mais esperta possível, por definição não é esperto o suficiente para debugá-lo."*

> *"Fale apenas quando puder melhorar o silêncio."*

> *"Eu sei que nada sei."*

## Estrutura do review

### Summary (comentário geral do PR)

Texto corrido, curto, conversacional. Não é relatório.

Estrutura natural:
1. Abrir reconhecendo o que está bom (específico, nunca genérico)
2. Mencionar os pontos que precisam de atenção (sem bullet list formatada)
3. Opcionalmente fechar com uma citação se encaixar no contexto

Exemplo:
```
O PR ficou bem mais enxuto, a consolidação no BackupService e a
remoção do LocalStorage simplificaram bastante a arquitetura.
A paginação cursor-based é uma melhoria real de ergonomia operacional.

Deixei alguns pontos inline. Os dois que mais me preocupam são a
questão do socket sem autenticação e o risco de memória no export
de mensagens. O resto são sugestões menores que podem ir num
follow-up.

> *"A perfeição é alcançada não quando não há mais nada a adicionar,
> mas quando não há mais nada a remover."*
```

### Comentários inline

Texto corrido conversacional. Sem headers. A severidade fica implícita:

| Intenção | Como comunica |
|---|---|
| Bloqueante | "Essa parte me preocupou", "Isso pode causar regressão" |
| Importante | "Vale considerar", "Seria bom proteger" |
| Sugestão leve | "Se não for dar muito trabalho", "Num follow-up talvez" |
| Trivial | "Nit:", frase curta e direta |
| Elogio | Abrir descrevendo o que gostou e por quê |
| Dúvida | "Me corrige se estiver errado", "Isso foi intencional?" |
| Fora do escopo | "Fora do escopo deste PR, mas..." |

### Proporção saudável

Um bom review tem equilíbrio entre elogios e sugestões. Não é necessário elogiar cada arquivo, mas reconhecer pelo menos uma decisão boa do autor mostra que o review foi feito com atenção e respeito.
