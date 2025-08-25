# TODO List - Gyld Team Re-Assignment Exercise

## 🎯 Pre-Development (15 min)

- [ ] Revisar y entender completamente los datos de `level_a_players`
- [ ] Definir qué significa "equilibrado" para este contexto
  - [ ] Balancear por tamaño de equipo (requisito)
  - [ ] Decidir métrica secundaria (engagement, puntos, actividad reciente, etc.)
- [ ] Elegir lenguaje/tecnología (TypeScript/Node recomendado)
- [ ] Crear estructura básica del proyecto

## 📊 Análisis de Datos (20 min)

- [ ] Parsear correctamente el CSV de `level_a_players`
- [ ] Explorar la distribución de datos:
  - [ ] Rangos de engagement, puntos, actividad
  - [ ] Distribución actual de equipos
  - [ ] Identificar outliers o jugadores inactivos
- [ ] Normalizar/escalar métricas para comparación justa
- [ ] Decidir cómo manejar valores faltantes/edge cases

## 🔧 Algoritmo Core (45 min)

- [ ] **Diseñar estrategia de balanceo:**
  - [ ] Crear "score" compuesto por jugador (engagement + actividad + etc.)
  - [ ] Ordenar jugadores por score para distribución equitativa
  - [ ] Implementar algoritmo determinístico (ej: round-robin con semilla)
- [ ] **Implementar lógica de asignación:**
  - [ ] Distribuir jugadores manteniendo tamaños similares
  - [ ] Manejar casos donde N jugadores no es divisible por T equipos
  - [ ] Asegurar determinismo (mismo input → mismo output)
- [ ] **Sistema de desempate:**
  - [ ] Definir regla clara para empates (ej: por player_id alfabético)
  - [ ] Documentar la regla en README

## 💻 Implementación Técnica (30 min)

- [ ] **Entrada de comandos:**
  - [ ] Soporte para `--teams N`
  - [ ] Soporte para `--seed N` (opcional)
  - [ ] Validación de parámetros
- [ ] **Procesamiento:**
  - [ ] Leer CSV de data/level_a_players.csv
  - [ ] Aplicar algoritmo de redistribución
  - [ ] Generar mapping player_id → new_team
- [ ] **Salida:**
  - [ ] Imprimir asignaciones a stdout
  - [ ] Generar resumen por equipo con estadística de confianza

## 📈 Estadísticas y Resumen (20 min)

- [ ] **Por cada equipo mostrar:**
  - [ ] Tamaño del equipo
  - [ ] Métrica de equidad elegida (ej: promedio de engagement)
  - [ ] Justificación de 1-2 oraciones de por qué es confiable
- [ ] **Estadísticas globales:**
  - [ ] Desviación estándar entre equipos
  - [ ] Rango min/max de la métrica elegida

## 📝 Documentación (15 min)

- [ ] **README.md completo:**
  - [ ] Instrucciones de ejecución
  - [ ] Explicación del enfoque en lenguaje simple
  - [ ] Una decisión de modelado específica + justificación (2-4 oraciones)
  - [ ] Regla de desempate en una oración
  - [ ] Tradeoffs por límite de tiempo
  - [ ] "Si tuviera más tiempo..."
  - [ ] Tiempo total invertido (hh:mm)
  - [ ] Indicar si se usó IA o no

## 🤖 Documentación de IA (si aplica)

- [ ] **Si usaste IA:**
  - [ ] Crear carpeta `prompts/`
  - [ ] Incluir 1-3 prompts usados
  - [ ] Crear `FIXES.md` con 3-5 correcciones concretas hechas a output de IA
- [ ] **Si NO usaste IA:**
  - [ ] Crear `DECISIONS.md` con 3-5 decisiones clave tomadas

## 🧪 Testing y Validación (10 min)

- [ ] Probar con diferentes números de equipos (3, 4, 5)
- [ ] Verificar determinismo (misma entrada = misma salida)
- [ ] Verificar que no haya equipos con >1 jugador de diferencia
- [ ] Revisar que las estadísticas por equipo se vean razonables

## 📦 Entrega Final (5 min)

- [ ] Limpiar código y comentarios
- [ ] Verificar que `npm start -- --teams 3 --seed 42` funcione
- [ ] Subir a GitHub o preparar ZIP
- [ ] Double-check que todos los entregables estén incluidos

---

## ⏰ Distribución de Tiempo Sugerida

- **Total: ~2 horas**
- Análisis y diseño: 35 min
- Implementación: 75 min
- Documentación: 20 min
- Testing: 10 min

## 💡 Ideas Clave para el Algoritmo

1. **Score compuesto**: Combinar engagement + actividad reciente + puntos
2. **Distribución snake draft**: Alternar orden de asignación para balance
3. **Determinismo**: Usar player_id como tiebreaker + semilla opcional
4. **Métrica de confianza**: Mostrar desviación estándar del score entre equipos
