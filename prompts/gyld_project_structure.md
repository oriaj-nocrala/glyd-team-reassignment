# Gyld Team Reassignment - Estructura de Proyecto

```
gyld-team-reassignment/
│
├── 📁 src/
│   ├── 📄 index.ts                    # Entry point y CLI parsing
│   ├── 📄 types.ts                    # TypeScript interfaces y types
│   │
│   ├── 📁 data/
│   │   ├── 📄 parser.ts               # CSV parsing y data loading
│   │   └── 📄 validator.ts            # Data validation y cleaning
│   │
│   ├── 📁 analysis/
│   │   ├── 📄 metrics.ts              # Cálculo de scores y normalización
│   │   └── 📄 balancer.ts             # Algoritmo de balanceo de equipos
│   │
│   ├── 📁 assignment/
│   │   ├── 📄 shuffler.ts             # Core reassignment algorithm
│   │   └── 📄 deterministic.ts       # Seed handling y reproducibilidad
│   │
│   └── 📁 output/
│       ├── 📄 formatter.ts            # Format de salida y pretty printing
│       └── 📄 statistics.ts          # Team summaries y fairness stats
│
├── 📁 data/                           # Data files (como especifica el ejercicio)
│   ├── 📄 level_a_players.csv         # Dataset principal
│   ├── 📄 level_b_events.csv          # [Opcional] Raw events
│   ├── 📄 level_b_messages.csv        # [Opcional] Chat messages
│   └── 📄 level_b_spend.csv           # [Opcional] Spend data
│
├── 📁 output/                         # Generated output files (opcional)
│   └── 📄 team_assignments.json       # Resultado de la reassignación
│
├── 📁 tests/                          # Testing files
│   ├── 📄 shuffler.test.ts           # Unit tests para algoritmo
│   ├── 📄 metrics.test.ts            # Tests para cálculos
│   └── 📄 integration.test.ts        # End-to-end testing
│
├── 📁 prompts/                        # [Si usas AI] Prompts utilizados
│   ├── 📄 algorithm-design.md         # Prompt para diseño de algoritmo
│   ├── 📄 typescript-structure.md     # Prompt para estructura de proyecto
│   └── 📄 FIXES.md                    # Correcciones hechas al output de AI
│
├── 📁 docs/                           # Documentation adicional
│   └── 📄 DECISIONS.md                # [Si NO usas AI] Decisiones clave
│
├── 📄 package.json                    # NPM dependencies y scripts
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 .gitignore                      # Git ignore rules
└── 📄 README.md                       # Documentación principal
```

## 📋 Descripción de Archivos Clave

### 🚀 **src/index.ts**
```typescript
// Entry point - CLI argument parsing y orchestration
// Maneja --teams, --seed, ejecuta pipeline completo
```

### 📊 **src/types.ts**
```typescript
// Interfaces centralizadas:
// Player, Team, AssignmentResult, BalanceMetrics, etc.
```

### 📈 **src/analysis/metrics.ts**
```typescript
// Funciones para calcular player scores:
// - normalizeEngagement()
// - calculateActivityScore()
// - computeCompositeScore()
```

### ⚖️ **src/analysis/balancer.ts**
```typescript
// Lógica de balanceo:
// - validateTeamSizes()
// - calculateTeamBalance()
// - assessFairness()
```

### 🔀 **src/assignment/shuffler.ts**
```typescript
// Core algorithm:
// - snakeDraftAssignment()
// - roundRobinDistribution()
// - deterministicShuffle()
```

### 📄 **src/output/statistics.ts**
```typescript
// Team summaries y fairness metrics:
// - generateTeamSummary()
// - calculateStandardDeviation()
// - createFairnessJustification()
```

## 🛠️ Scripts NPM Sugeridos

```json
{
  "scripts": {
    "start": "ts-node src/index.ts",
    "build": "tsc",
    "test": "jest",
    "dev": "ts-node-dev src/index.ts",
    "lint": "eslint src/**/*.ts"
  }
}
```

## 🎯 Ventajas de esta Estructura

### ✅ **Modularidad**
- Cada responsabilidad en su propio módulo
- Fácil testing unitario
- Reutilización de componentes

### ✅ **Escalabilidad**
- Fácil agregar nuevos algoritmos de balanceo
- Extensible para Level B data si se necesita
- Separación clara de concerns

### ✅ **Mantenibilidad**
- Tipos centralizados en un lugar
- Lógica de negocio separada de I/O
- Easy debugging por módulo

### ✅ **Testing**
- Unit tests por componente
- Integration tests end-to-end
- Mocking fácil de data layer

## 🚦 Flujo de Ejecución

```
CLI Input → Data Parser → Metrics Calculator → 
Assignment Algorithm → Output Formatter → Console/Files
```

## ⚡ Quick Start Commands

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev -- --teams 3 --seed 42

# Build y run production
npm run build && npm start -- --teams 4

# Run tests
npm test

# Ejemplo completo
npm start -- --teams 3 --seed 42 > output/results.txt
```

Esta estructura te permite trabajar de forma incremental, testear cada componente por separado, y escalar fácilmente si necesitas agregar features adicionales!