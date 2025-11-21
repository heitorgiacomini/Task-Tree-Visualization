# Task Tree Visualization

![Task Tree Screenshot](task-tree.jpg)

| Feature | Descrição |
| --- | --- |
| Modelo de tarefas hierárquicas | Estrutura em árvore usando classe `Task` com nome, status, percentual, descrição e filhos. |
| Cálculo automático de progresso | Percentual e status de cada nó calculados dinamicamente a partir dos filhos. |
| Visualização com D3.js | Árvore interativa em SVG com nós, ligações e setas renderizadas com D3.v7. |
| Gradiente de cor por progresso | Cores dos nós variando suavemente conforme o percentual concluído. |
| Seleção e destaque de nó | Clique em um nó para destacá-lo visualmente e carregar seus dados no painel. |
| Tooltip com descrição | Exibição da descrição da tarefa ao passar o mouse sobre o nó. |
| Edição de tarefas | Painel lateral para alterar nome, status (folhas) e descrição da tarefa selecionada. |
| Criação de subtarefas | Botão para criar nós filhos sob o nó selecionado, iniciando como "Task" com status falso. |
| Exclusão de nós | Remoção de nós selecionados, com proteção contra exclusão do nó raiz. |
| Reorganização da hierarquia | Função "Mover para..." para mudar o pai de um nó sem permitir ciclos. |
| Importação de JSON | Carregamento de árvores a partir de arquivo JSON ou `task-tree.json` padrão. |
| Exportação em JSON | Exporta a estrutura de tarefas atual para arquivo JSON. |
| Exportação em imagem | Exportação do diagrama em formatos PNG, JPEG e SVG preservando o estilo. |
| Layout adaptativo | Largura/altura do SVG e espaçamento ajustados dinamicamente ao número de nós e profundidade. |
| UX refinada do painel | Painel de edição fixo que não fecha durante seleção de texto nem ao interagir com os controles. |
