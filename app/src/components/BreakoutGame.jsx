import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Box, styled } from '@mui/material';

const ContainerGameWrapper = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

export default function BreakoutGame({ isHost, connectionReady, sendMove, onMessage }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  // Phaser roda fora do ciclo de render do React, então guardamos os valores
  // mais recentes das props num ref pra cena sempre ler o estado atual.
  const apiRef = useRef({ sendMove });
  useEffect(() => {
    apiRef.current.sendMove = sendMove;
  }, [sendMove]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.isHost = isHost;
      sceneRef.current.connectionReady = connectionReady;
    }
  }, [isHost, connectionReady]);

  // ── Setup do Phaser (roda uma vez) ──
  useEffect(() => {
    class Breakout extends Phaser.Scene {
      constructor() {
        super({ key: 'breakout' });

        this.playing = false;
        this.startButton = null;
        this.level = 1;
        this.scoreText = null;
        this.score = 0;
        this.lives = 3;
        this.livesText = null;
        this.lifeLostText = null;
        this.power = null;
        this.bricks = null;
        this.paddle = null;
        this.paddle2 = null;
        this.ball = null;
        this.spaceKey = null;
        this.cursors = null;

        this.isHost = isHost;
        this.connectionReady = connectionReady;
        this.remotePaddleX = 400;
        this.lastStateSent = 0;
      }

      preload() {
        const progress = this.add.graphics();

        this.load.on('progress', (value) => {
          progress.clear();
          progress.fillStyle(0xffffff, 1);
          progress.fillRect(0, 270, 800 * value, 60);
        });

        this.load.on('complete', () => progress.destroy());

        this.load.image('background', '/assets/space1.png');
        this.load.audio('music', '/assets/night.ogg');
        this.load.audio('gameover', '/assets/gameover.ogg');
        this.load.atlas('assets', '/images/breakout.png', '/images/breakout.json');
        this.load.image('red', '/images/red.png');
        this.load.spritesheet('buttonStart', '/images/button.png', {
          frameWidth: 120,
          frameHeight: 40,
        });
      }

      create() {
        sceneRef.current = this;

        this.add.image(400, 300, 'background');
        this.music = this.sound.add('music');
        this.overSong = this.sound.add('gameover');

        this.physics.world.setBoundsCollision(true, true, false, false);
        
        this.bricks = this.physics.add.staticGroup({
          key: 'assets',
          frame: ['blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1'],
          frameQuantity: 10,
          gridAlign: {
            width: 10,
            height: 6,
            cellWidth: 64,
            cellHeight: 32,
            x: 80,
            y: 200,
          },
        });

        this.startButton = this.add.image(400, 300, 'buttonStart').setInteractive();
        this.startButton.on('pointerup', this.startGame, this);

        this.scoreText = this.add.text(16, 16, 'Level: 1 Score: 0', {
          fontSize: '18px',
          fill: '#ffffff',
        });
        this.livesText = this.add.text(650, 16, 'Lives: 3', {
          fontSize: '18px',
          fill: '#ffffff',
        });
        this.lifeLostText = this.add
          .text(400, 300, '', { fontSize: '18px', fill: '#ffffff', backgroundColor: '#000000' })
          .setOrigin(0.5);
        this.lifeLostText.visible = false;

        // Phaser 3.60+ removeu o ParticleEmitterManager: add.particles() já
        // retorna o emitter diretamente, sem precisar de createEmitter().
        this.power = this.add.particles(0, 0, 'red', {
          speed: 60,
          scale: { start: 0.5, end: 0 },
          blendMode: 'ADD',
        });
        this.power.visible = false;

        this.ball = this.physics.add
          .image(400, 500, 'assets', 'ball1')
          .setCollideWorldBounds(true)
          .setBounce(1);
        this.ball.setData('onPaddle', true);
        this.power.startFollow(this.ball);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();
        this.paddle2 = this.physics.add.image(300, 50, 'assets', 'paddle1').setImmovable();

        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball, this.paddle2, this.hitPaddle, null, this);

        // Fix: spaceKey nunca era inicializado no jogo original (ficava null e
        // quebrava o update() a cada frame). Registrando a tecla aqui.
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on('pointermove', (pointer) => {
          if (this.isHost) {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);
            if (this.ball.getData('onPaddle')) this.ball.x = this.paddle.x;
          } else {
            this.paddle2.x = Phaser.Math.Clamp(pointer.x, 52, 748);
            if (this.connectionReady) {
              apiRef.current.sendMove({ type: 'input', paddle2x: this.paddle2.x });
            }
          }
        });

        this.input.on('pointerup', () => {
          if (this.isHost) {
            if ((this.ball.getData('onPaddle') && this.playing) || !this.playing) {
              this.startGame();
            }
          }
        });
      }

      startGame() {
        if (!this.isHost) {
          this.lifeLostText.setText('Aguardando host iniciar o jogo...').visible = true;
          return;
        }

        if (!this.connectionReady) {
          this.lifeLostText.setText('Conecte o adversário primeiro.').visible = true;
          return;
        }

        if (this.ball.getData('onPaddle')) {
          if (!this.playing) this.music.play({ loop: true });
          this.playing = true;
          this.ball.setVelocity(-75, -300);
          this.ball.setData('onPaddle', false);
          this.startButton.visible = false; 
          this.lifeLostText.setText('Life lost, click or press space to continue');
          this.lifeLostText.visible = false;
          apiRef.current.sendMove({ type: 'start' });
        }
      }

      applyRemoteStart() {
        if (!this.playing && this.ball.getData('onPaddle')) {
          this.playing = true;
          this.lifeLostText.setText('Jogo iniciado pelo host').visible = false;
        }
      }

      gameOver() {
        this.playing = false;
        this.music.stop();
        this.overSong.play();
        this.resetLevel(false);
      }

      hitPaddle(ball, paddle) {
        let diff = 0;

        if (ball.x < paddle.x) {
          diff = paddle.x - ball.x;
          ball.setVelocityX(-10 * diff);
        } else if (ball.x > paddle.x) {
          diff = ball.x - paddle.x;
          ball.setVelocityX(10 * diff);
        } else {
          ball.setVelocityX(2 + Math.random() * 8);
        }

        if (this.ball.body.velocity.x > 200 && !this.power.visible) {
          this.power.visible = true;
        } else if (this.ball.body.velocity.x < 200 && this.power.visible) {
          this.power.visible = false;
        }
      }

      hitBrick(ball, brick) {
        brick.disableBody(true, true);
        this.score += this.power.visible ? 20 : 10;
        this.scoreText.setText(`Level: ${this.level} Score: ${this.score}`);

        if (this.bricks.countActive() === 0) this.resetLevel(true);
      }

      resetBall() {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
      }

      resetLevel(win) {
        if (win) {
          this.level++;
          this.scoreText.setText(`Level: ${this.level} Points: ${this.score}`);
        } else {
          this.lives = 3;
          this.score = 0;
          this.level = 1;
          this.scoreText.setText(`Level: ${this.level} Points: ${this.score}`);
          this.livesText.setText('Lives: ' + this.lives);
          this.lifeLostText.setText('You lost, game over!').visible = true;
        }

        this.resetBall();
        this.bricks.getChildren().forEach((brick) => {
          brick.enableBody(false, 0, 0, true, true);
        });
      }

      applyRemoteState(state) {
        this.level = state.level;
        this.score = state.score;
        this.lives = state.lives;
        this.playing = state.playing;
        this.startButton.visible = state.startButtonVisible;
        this.scoreText.setText(`Level: ${this.level} Score: ${this.score}`);
        this.livesText.setText('Lives: ' + this.lives);
        this.lifeLostText.setText(state.lifeLostText);
        this.lifeLostText.visible = state.lifeLostVisible;
        this.ball.setPosition(state.ball.x, state.ball.y);
        this.ball.setVelocity(state.ball.vx, state.ball.vy);
        this.ball.setData('onPaddle', state.ball.onPaddle);
        this.paddle.x = state.paddleX;
        this.paddle2.x = state.paddle2X;
        this.power.visible = state.powerVisible;

        this.bricks.getChildren().forEach((brick, index) => {
          if (state.bricks[index]) {
            if (!brick.active) brick.enableBody(false, 0, 0, true, true);
          } else if (brick.active) {
            brick.disableBody(true, true);
          }
        });
      }

      update(time) {
        if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
          this.startGame();
        }

        if (this.isHost) {
          if (this.cursors.left.isDown) {
            this.paddle.x = Phaser.Math.Clamp(this.paddle.x - 10, 52, 748);
            if (this.ball.getData('onPaddle')) this.ball.x = this.paddle.x;
          } else if (this.cursors.right.isDown) {
            this.paddle.x = Phaser.Math.Clamp(this.paddle.x + 10, 52, 748);
            if (this.ball.getData('onPaddle')) this.ball.x = this.paddle.x;
          }

          this.paddle2.x = Phaser.Math.Clamp(this.remotePaddleX, 52, 748);

          if (this.connectionReady && time - this.lastStateSent > 50) {
            this.sendHostState();
            this.lastStateSent = time;
          }

          if (this.playing && (this.ball.y > 600 || this.ball.y < 0)) {
            this.resetBall();
            this.lives--;
            if (this.lives > 0) {
              this.livesText.setText('Lives: ' + this.lives);
              this.lifeLostText.visible = true;
            } else {
              this.gameOver();
            }
          }
        } else {
          if (this.cursors.left.isDown) {
            this.paddle2.x = Phaser.Math.Clamp(this.paddle2.x - 10, 52, 748);
            if (this.connectionReady) {
              apiRef.current.sendMove({ type: 'input', paddle2x: this.paddle2.x });
            }
          } else if (this.cursors.right.isDown) {
            this.paddle2.x = Phaser.Math.Clamp(this.paddle2.x + 10, 52, 748);
            if (this.connectionReady) {
              apiRef.current.sendMove({ type: 'input', paddle2x: this.paddle2.x });
            }
          }
        }
      }

      sendHostState() {
        if (!this.isHost) return;

        const brickStates = [];
        this.bricks.getChildren().forEach((brick) => brickStates.push(brick.active));

        apiRef.current.sendMove({
          type: 'state',
          state: {
            ball: {
              x: this.ball.x,
              y: this.ball.y,
              vx: this.ball.body.velocity.x,
              vy: this.ball.body.velocity.y,
              onPaddle: this.ball.getData('onPaddle'),
            },
            paddleX: this.paddle.x,
            paddle2X: this.paddle2.x,
            level: this.level,
            score: this.score,
            lives: this.lives,
            playing: this.playing,
            powerVisible: this.power.visible,
            startButtonVisible: this.startButton.visible,
            lifeLostText: this.lifeLostText.text,
            lifeLostVisible: this.lifeLostText.visible,
            bricks: brickStates,
          },
        });
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      scale: { mode: Phaser.Scale.NONE, width: 800, height: 600 },
      physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
      scene: [Breakout],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Roteia mensagens recebidas do peer remoto pra dentro da cena ──
  useEffect(() => {
    if (!onMessage) return;

    onMessage((data) => {
      const scene = sceneRef.current;
      if (!scene) return;

      if (data.type === 'input' && scene.isHost) {
        scene.remotePaddleX = data.paddle2x;
      } else if (data.type === 'state' && !scene.isHost) {
        scene.applyRemoteState(data.state);
      } else if (data.type === 'start' && !scene.isHost) {
        scene.applyRemoteStart();
      }
    });
  }, [onMessage]);

  return (
    <ContainerGameWrapper>
      <div ref={containerRef} id="mygame" />
    </ContainerGameWrapper>
  )
}