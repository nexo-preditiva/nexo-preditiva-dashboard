# NEXO PREDITIVA — PROJECT_STATE.md

> Ultima auditoria: 09/08/2026 pelo ATLAS PRIME. Todas as informacoes abaixo sao VERIFICADAS por evidencia direta (console Firebase, GitHub, site publicado), exceto onde marcado como INFERIDO ou NAO VERIFICADO.

## OBJETIVO
SaaS de inteligencia comercial preditiva: identifica leads que precisam do servico do cliente HOJE e entrega no WhatsApp. Publico-alvo: pequenas empresas de servico (ex: comunicacao visual, construcao).

## PROBLEMA REAL
Pequenas empresas perdem clientes que nao sabem que elas existem; falta de leads qualificados e follow-up estruturado.

## PROPOSTA DE VALOR
"Pare de perder clientes que nao sabem que voce existe" — leads entregues direto no WhatsApp.

## ESTAGIO ATUAL
PRIMEIROS USUARIOS / RECEITA INICIAL — REALIZADO: 2 clientes piloto ativos com dados reais (TANZ Comunicacao Visual, CONSTRUOLI) confirmados no Firestore.

## FONTE DE VERDADE (P0 — RESOLVIDO)
- Projeto Firebase de PRODUCAO: `studio-8906801948-ecb0a` (plano Spark, gratuito).
- Projeto Firebase `nexo-preditiva-mvp` — DESCONTINUADO. Nao deve mais ser usado.
- Repositorio GitHub ativo: `nexo-preditiva/nexo-preditiva-dashboard` (public) — CI/CD funcional, aponta corretamente para `studio-8906801948-ecb0a`.
- Repositorio GitHub `nexo-preditiva/nexo-preditiva` (private) — MVP legado, marcado como DESCONTINUADO no README, deploy automatico DESATIVADO (agora workflow_dispatch manual).

## URLS PUBLICADAS (VERIFICADO)
- Landing page institucional: https://studio-8906801948-ecb0a.web.app — ONLINE, funcional, fluxo de cadastro testado e funcionando.
- Dashboard/CRM: https://nexo-preditiva-dashboard.web.app — ONLINE, funcional (login Google, tela carrega corretamente).

## FUNCIONALIDADES CONCLUIDAS (VERIFICADO)
- Autenticacao Google (Firebase Auth) ativa e funcional.
- Firestore com dados reais: colecoes `leads`, `tenants`, `users`, `comissoes`, `config_clientes`, `banco_talentos`.
- Dashboard com CRM (crm.html), relatorios (relatorios.html), gestao de leads (app.js).
- Landing page com CTA de cadastro ("Teste Gratis", trial de 60 dias).
- Deploy automatico via GitHub Actions com OIDC (Workload Identity Federation) — sem uso de chaves estaticas.

## FUNCIONALIDADES PENDENTES (PLANEJADO)
- Secao de planos/precos na landing page (P4 — UX, nao existe atualmente).
- Motor ATLAS (automacao de prospeccao preditiva via Cloud Functions) — BLOQUEADO por exigir upgrade do plano Firebase para Blaze (custo). Aguardando aprovacao explicita do usuario.
- Documentacao tecnica consolidada (SKILL.md e SKILL-GESTAO-COMERCIAL.md existem mas nao foram auditados em profundidade nesta rodada).

## ARQUITETURA
- Frontend: HTML/CSS/JS vanilla (sem framework pesado), hospedado no Firebase Hosting.
- Backend: Firebase Auth + Firestore (NoSQL).
- CI/CD: GitHub Actions com autenticacao via Workload Identity Federation (sem secrets estaticos).

## CUSTOS
- Plano atual: Spark (gratuito), $0/mes, confirmado no console Firebase.
- Upgrade para Blaze necessario apenas para ativar Cloud Functions (motor ATLAS). NAO EXECUTADO — requer aprovacao explicita do usuario antes de qualquer acao.

## RISCOS / BUGS CONHECIDOS
- Nenhum erro critico encontrado nesta auditoria. Ultimo deploy do dashboard passou nos testes (GitHub Actions run verde).
- Historico do workflow do dashboard mostra falhas anteriores ja corrigidas (commits de fix anteriores).

## DECISOES REGISTRADAS
- 09/08/2026: Fonte de verdade consolidada em `studio-8906801948-ecb0a`.
- 09/08/2026: Repositorio MVP (`nexo-preditiva`) marcado como descontinuado, deploy automatico desativado para evitar deploys acidentais no projeto Firebase errado.

## PROXIMO GARGALO
Decisao do usuario sobre upgrade Blaze para ativar o motor ATLAS (Cloud Functions). Enquanto isso, proximo passo gratuito de maior impacto: adicionar secao de planos/precos na landing page para reduzir friccao de conversao (P4).
