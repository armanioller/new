# RPG Low-Poly 3D (Three.js)

Um jogo de RPG medieval estilizado com foco em exploração, coleta de recursos e construção.

## Funcionalidades Atuais

- **Mundo Infinito**: Sistema de terreno com "mar infinito" e horizonte suave.
- **Ciclo Dia/Noite**: Iluminação dinâmica que afeta o céu, nevoeiro e reflexos na água.
- **Exploração Subaquática**: Efeitos visuais de mergulho, nevoeiro turvo e ocultação do céu ao entrar na água.
- **Sistema de Minimapa**: Minimapa circular com marcadores cardinais (N, S, L, O) e rastreamento do jogador com indicador de direção.
- **Coleta e Construção**: Colete madeira e pedra para construir cercas, pisos e fogueiras.
- **Sistema LOD (Gráficos)**: Perfis de qualidade (Baixo, Médio, Alto) que ajustam a complexidade do terreno, densidade de recursos e resolução de sombras.

## Tecnologias

- **Three.js**: Engine 3D.
- **Vite**: Build tool e servidor de desenvolvimento.
- **Playwright**: Testes de regressão visual e lógica.

## Como Jogar

- **WASD**: Movimentação.
- **Espaço**: Pulo.
- **F**: Colher recursos.
- **B**: Modo construção.
- **Botão Direito**: Girar câmera.
- **Scroll**: Zoom.

---
Documentação técnica disponível no código-fonte em `src/`.
