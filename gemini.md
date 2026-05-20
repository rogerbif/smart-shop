---
trigger: always_on
---

# 🛡️ Amago Academy - 2026

# 📜 Protocolo GEMINI

> Este arquivo define o comportamento mestre da IA neste espaço de trabalho.

---

## 🔴 CRITICAL: PROTOCOLO DE AGENTES E SKILLS

> **MANDATÓRIO:** Você DEVE ler o arquivo do agente apropriado e suas skills ANTES de realizar qualquer implementação. Esta é a regra de maior prioridade.

### 1. Protocolo de Carregamento Modular
Agente ativado → Verificar frontmatter "skills:" → Ler SKILL.md (MAPA) → Ler seções específicas conforme necessário.

- **Leitura Seletiva:** NÃO leia todos os arquivos de uma pasta de skill. Leia o `SKILL.md` primeiro e depois apenas as seções que casam com o pedido do usuário.
- **Prioridade de Regras:** P0 (gemini.md) > P1 (Agente) > P2 (SKILL.md). Todas as regras são vinculativas.

---

## 📥 CLASSIFICADOR DE REQUISIÇÃO (PASSO 1)

**Antes de qualquer ação, classifique o pedido:**

| Tipo de Pedido | Palavras-Chave | Ação |
| :--- | :--- | :--- |
| **DÚVIDA** | "o que é", "como funciona", "explique" | Resposta em texto |
| **ANÁLISE** | "analise", "liste arquivos", "overview" | Diagnóstico técnico |
| **CÓDIGO SIMPLES** | "corrija", "adicione", "mude" (1 arquivo) | Edição direta |
| **CÓDIGO COMPLEXO** | "construa", "crie", "refatore" | **implementation_plan.md Obrigatório** |
| **DESIGN/UI** | "design", "UI", "página", "dashboard" | **implementation_plan.md Obrigatório** |

---

## 🤖 ROTEAMENTE INTELIGENTE (PASSO 2)

**Sempre que for gerar código ou design, anuncie o agente especializado:**

```markdown
🤖 **Aplicando conhecimentos de `@[nome-do-agente]`...**
```

1. **Análise Silenciosa**: Não seja prolixo sobre sua análise interna.
2. **Respeite Overrides**: Se o usuário pedir um agente específico, use-o.
3. **Portão Socrático**: Para tarefas vagas ou complexas, PARE e faça perguntas estratégicas antes de codar.

---

## 🛑 PORTÃO SOCRÁTICO (MANDATÓRIO)

**NUNCA assuma 100% de um pedido complexo. Faça perguntas de impacto:**
- Quem é o usuário final?
- Qual o principal ponto de dor que estamos resolvendo?
- Existem restrições técnicas ou estéticas específicas?

---

## 🛠️ SCRIPTS E FERRAMENTAS

Utilize os scripts da pasta `tools/` para manter a integridade do kit:
- `python tools/maintenance/validate_skills.py`: Valida o padrão das skills.
- `python tools/maintenance/generate_index.py`: Gera o índice automático do kit.

---
