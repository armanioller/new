# Conceito do Jogo: "Harvest Frontier" (Nome Provisório)

## Estilo Visual
- **Low-Poly**: Modelos simples, cores vibrantes, pouca textura (cores sólidas/gradientes).
- **Ambiente**: Uma ilha ou clareira florestal.

## Personagem
- Humano low-poly (formato .glb).
- Animações: Idle (parado), Walk (andando), Action (colhendo).

## Mecânicas Principais
1. **Movimentação**:
   - O jogador controla o personagem (WASD ou clique no chão).
   - Câmera em terceira pessoa (fixa ou orbital).

2. **Colheita de Recursos**:
   - Árvores -> Madeira.
   - Pedras -> Pedra.
   - O jogador deve se aproximar do recurso e pressionar uma tecla ou clicar para colher.

3. **Inventário Simples**:
   - Interface (UI) para mostrar a quantidade de madeira e pedra coletada.

## Fluxo de Jogo (Gameplay Loop)
1. Explorar o mapa.
2. Encontrar recursos.
3. Coletar recursos.
4. (Futuro) Construir ou trocar recursos.

## Lógica Técnica
- **Motor**: Three.js.
- **Física**: Simples (detecção de colisão baseada em distância ou bounding boxes).
- **Gerenciamento de Estado**: Objeto JavaScript simples para armazenar inventário e posição.
