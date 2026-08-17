# RM Assist — MVP completo para publicação

Esta versão concentra o fluxo principal do sistema em uma entrega única.

## Já implementado

- PWA para iPhone / navegador
- painel inicial dinâmico
- clientes
- locais
- equipamentos
- chamados
- agendamento
- agenda
- início de atendimento
- ordem de serviço em 5 etapas
- diagnóstico
- checklist
- medições e ΔT
- materiais
- execução e recomendações
- conclusão
- valor e forma de pagamento
- aceite do responsável
- relatório imprimível / salvar como PDF
- listagem de relatórios
- orçamentos básicos
- financeiro básico
- base de PMOC
- schema Supabase para futura sincronização

## Importante sobre esta versão

Para permitir teste imediato sem configuração técnica, os dados operacionais são gravados no armazenamento local do navegador (`localStorage`).

Isso significa:
- funciona no navegador mesmo antes de configurar Supabase;
- dados ficam no aparelho/navegador usado;
- limpar dados do Safari/navegador apaga os registros;
- sincronização entre iPhone e Windows só deve ser usada depois da conexão ao Supabase.

## Rodar no Windows

Instale Node.js LTS, abra esta pasta no terminal e execute:

    npm install
    npm run dev

Abra http://localhost:3000.

## Publicação recomendada

1. Criar repositório GitHub.
2. Enviar esta pasta.
3. Importar o repositório na Vercel.
4. Publicar.
5. Abrir o endereço HTTPS no Safari do iPhone.
6. Compartilhar → Adicionar à Tela de Início.

## Antes de uso profissional com dados reais

Ainda é necessário configurar:
- autenticação;
- Supabase;
- políticas de segurança/RLS;
- armazenamento em nuvem para fotos/assinaturas;
- backup;
- domínio, se desejado.

O arquivo `supabase/schema.sql` contém a estrutura inicial do banco.

## Próxima ação prática

Publicar o MVP em um endereço HTTPS e testar o fluxo completo no iPhone com dados fictícios antes de migrar para dados reais.
