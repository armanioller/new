# Documentação Técnica: Harvest Frontier Engine

Este documento detalha a arquitetura matemática e sistêmica do jogo, projetada para garantir precisão visual e física em um ambiente 3D Three.js.

## 1. Sistema de Câmera (CameraManager)
O motor utiliza coordenadas esféricas para gerenciar quatro modos de visão distintos.

### Arquitetura Matemática
- **Yaw (Giro Horizontal):** Rotação em torno do eixo Y.
- **Pitch (Inclinação Vertical):** Rotação em torno do eixo X, limitada entre -85° e 85° para evitar "gimbal lock".
- **Transformação:** As coordenadas esféricas são convertidas em cartesianas (X, Y, Z) relativas ao jogador para posicionamento da câmera.

### Modos de Visão
1. **Isométrico (Rigid):**
   - Ângulos fixos: 45° Yaw, ~35.26° Pitch.
   - **Estabilização:** Utiliza uma altura lerpada (`isoStableY`) para suavizar variações bruscas no terreno, mantendo o movimento X/Z perfeitamente rígido com o jogador.
2. **Terceira Pessoa (Chase):**
   - **Chase Logic:** A câmera persegue a rotação física do jogador com um multiplicador de interpolação suave (atualmente `2.0 * delta`).
   - **Foco:** O `lookAt` é posicionado ligeiramente à frente do personagem para melhor visibilidade do horizonte.
3. **Primeira Pessoa (POV):**
   - **Eye Level:** Posicionada a 1.65m de altura.
   - **Otimização:** O mesh do personagem é ocultado (`visible = false`) para evitar clipping da câmera dentro da cabeça do modelo.
4. **Construtor (Free):**
   - Movimentação livre tipo "Fly Cam" usando WASD + Q/E (altura) + Mouse (rotação).

---

## 2. Locomoção do Personagem (Player)
A movimentação é inteiramente vetorial e relativa à visão da câmera.

### Movimento Relativo à Câmera (Camera-Relative)
Em vez de usar ângulos fixos, calculamos a direção baseada nos vetores globais da câmera:
1. Obtemos o vetor de direção frontal da câmera (`getWorldDirection`).
2. Projetamos este vetor no plano horizontal (Y=0) e normalizamos.
3. Calculamos o vetor lateral (`right`) usando o produto vetorial entre o eixo UP e o frontal.
4. O vetor de movimento final é a soma escalonada desses vetores baseada no input WASD.

### Rotação Suave (Mesh Interpolation)
O modelo visual (`group.rotation.y`) interpola em direção ao ângulo físico de movimento usando o caminho mais curto:
```javascript
let rotDiff = target - current;
rotDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
current += rotDiff * lerpFactor;
```

---

## 3. Ambiente e Terreno
- **Dia/Noite:** Ciclo de 24h com interpolação de cores entre Meia-Noite, Alvorada, Meio-Dia e Entardecer.
- **Terreno:** Gerado via ruído senoidal. As bordas são forçadas para baixo para criar o efeito de "Ilha".
- **Física de Água:** O personagem caminha no fundo do mar (seabed) em vez de boiar, utilizando o `getHeight` real da malha de terreno.

## 4. Persistência
As configurações são salvas no `localStorage` sob a chave `rpg_medieval_save` e podem ser exportadas/importadas via JSON.
