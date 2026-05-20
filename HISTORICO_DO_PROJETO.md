# Histórico do Projeto: SmartShop

### [20/05/2026] v0.1.0 - Refatoração UI da Tela de Lista e Bottom Sheet
- [UX/DesignOps] **Refatoração para Bottom Sheet**: O formulário de Adição de Item agora é renderizado usando um componente Atômico de Bottom Sheet no mobile.
- [UX/DesignOps] **Ajuste de Navegação na Tela de Detalhes**: Remoção da BottomNav (`/list/[id]`) para focar a experiência no conteúdo e lista.
- [UX/DesignOps] **Reposicionamento de Botões**: Botão de Adicionar Produto transferido para o cabeçalho superior direito e o botão de Excluir Lista reposicionado para o rodapé estilizado com classe `.btn-danger`.
- [Bug/Fix] **Layout do Formulário**: Correção de sobreposição ("quebra") dos campos de preço e quantidade mudando container grid para flexbox com constrição de layout (`min-width: 0`).

### [20/05/2026] v0.1.1 - Instalação Amago AI Kit
- [Infra] **Amago AI Kit**: Configuração do protocolo GEMINI como sistema mestre de inteligência na raiz do projeto e atualização de regras no `.gitignore`.
