import Matter from 'matter-js';
import { CatTier } from './Types';
import { getCatTier } from './CatData';

export interface CatBodyData {
  id: string;
  tier: number;
  catTier: CatTier;
  squishX: number;
  squishY: number;
  blinkTimer: number;
  blinkProgress: number;
  isMerging: boolean;
  settled: boolean;
  aboveDangerStartTime?: number;
}

export class PhysicsEngine {
  public engine: Matter.Engine;
  public world: Matter.World;
  public boxBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  };
  public dangerLineY: number;

  private onMergeCallback?: (tier: number, x: number, y: number) => void;
  private onGameOverCallback?: () => void;
  private onDangerAlertCallback?: (isAlert: boolean) => void;
  private isDangerAlerting: boolean = false;
  private collectionId: string = 'classic';

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    collectionId: string = 'classic'
  ) {
    this.collectionId = collectionId;

    // 1. Create Matter Engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.5, scale: 0.001 },
      enableSleeping: false,
    });
    this.world = this.engine.world;

    // 2. Compute Responsive Box Dimensions (centered in canvas)
    const boxW = Math.min(canvasWidth * 0.90, 390);
    const boxTop = Math.max(85, Math.min(130, canvasHeight * 0.18));
    const boxBottom = canvasHeight - 15;
    const boxH = boxBottom - boxTop;
    const boxLeft = (canvasWidth - boxW) / 2;
    const boxRight = boxLeft + boxW;

    this.boxBounds = {
      left: boxLeft,
      right: boxRight,
      top: boxTop,
      bottom: boxBottom,
      width: boxW,
      height: boxH,
    };

    this.dangerLineY = boxTop + 50;

    this.buildWalls();
    this.setupCollisionListener();
  }

  public setCollection(collectionId: string) {
    this.collectionId = collectionId;
  }

  public setOnMerge(cb: (tier: number, x: number, y: number) => void) {
    this.onMergeCallback = cb;
  }

  public setOnGameOver(cb: () => void) {
    this.onGameOverCallback = cb;
  }

  public setOnDangerAlert(cb: (isAlert: boolean) => void) {
    this.onDangerAlertCallback = cb;
  }

  private buildWalls() {
    const wallThickness = 60;
    const { left, right, top, bottom, width, height } = this.boxBounds;

    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      restitution: 0.1,
      friction: 0.2,
      label: 'wall',
    };

    // Bottom floor
    const bottomWall = Matter.Bodies.rectangle(
      left + width / 2,
      bottom + wallThickness / 2,
      width + wallThickness * 2,
      wallThickness,
      wallOptions
    );

    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      left - wallThickness / 2,
      top + height / 2,
      wallThickness,
      height,
      wallOptions
    );

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      right + wallThickness / 2,
      top + height / 2,
      wallThickness,
      height,
      wallOptions
    );

    // Rounded corner bumpers at bottom left and bottom right
    const cornerSize = 24;
    const leftCorner = Matter.Bodies.polygon(
      left + cornerSize / 2,
      bottom - cornerSize / 2,
      3,
      cornerSize,
      { ...wallOptions, angle: Math.PI / 4 }
    );
    const rightCorner = Matter.Bodies.polygon(
      right - cornerSize / 2,
      bottom - cornerSize / 2,
      3,
      cornerSize,
      { ...wallOptions, angle: -Math.PI / 4 }
    );

    Matter.Composite.add(this.world, [
      bottomWall,
      leftWall,
      rightWall,
      leftCorner,
      rightCorner,
    ]);
  }

  // Create and spawn a dropped cat
  public spawnCat(
    x: number,
    y: number,
    tier: number,
    initialVy: number = 0
  ): Matter.Body {
    const catTier = getCatTier(tier, this.collectionId);
    const r = catTier.radius;

    // Density increases gently with size for realistic inertia
    const density = 0.0018 * Math.pow(1.12, tier);

    const body = Matter.Bodies.circle(x, y, r, {
      restitution: 0.24, // Gentle cute bouncy elasticity
      friction: 0.12,
      frictionAir: 0.015,
      density,
      label: 'cat',
    });

    if (initialVy !== 0) {
      Matter.Body.setVelocity(body, { x: 0, y: initialVy });
    }

    const customData: CatBodyData = {
      id: Math.random().toString(36).substring(2),
      tier,
      catTier,
      squishX: 1,
      squishY: 1,
      blinkTimer: 100 + Math.random() * 200,
      blinkProgress: 0,
      isMerging: false,
      settled: false,
    };

    (body as unknown as { customData: CatBodyData }).customData = customData;
    Matter.Composite.add(this.world, body);
    return body;
  }

  private setupCollisionListener() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        if (bodyA.label !== 'cat' || bodyB.label !== 'cat') continue;

        const dataA = (bodyA as unknown as { customData: CatBodyData }).customData;
        const dataB = (bodyB as unknown as { customData: CatBodyData }).customData;

        if (!dataA || !dataB) continue;

        // Apply bounce squish deform
        const impactSpeed = Matter.Vector.magnitude(
          Matter.Vector.sub(bodyA.velocity, bodyB.velocity)
        );
        if (impactSpeed > 2) {
          const squish = Math.min(0.25, impactSpeed * 0.02);
          dataA.squishX = 1 + squish;
          dataA.squishY = 1 - squish;
          dataB.squishX = 1 + squish;
          dataB.squishY = 1 - squish;
        }

        // Check if same tier and not yet merging
        if (dataA.tier === dataB.tier && !dataA.isMerging && !dataB.isMerging) {
          dataA.isMerging = true;
          dataB.isMerging = true;

          // Merge cats at midpoint
          const midX = (bodyA.position.x + bodyB.position.x) / 2;
          const midY = (bodyA.position.y + bodyB.position.y) / 2;
          const currentTier = dataA.tier;

          // Schedule removal and spawn
          setTimeout(() => {
            Matter.Composite.remove(this.world, bodyA);
            Matter.Composite.remove(this.world, bodyB);

            const nextTier = Math.min(11, currentTier + 1);
            const newCat = this.spawnCat(midX, midY, nextTier, -3.2);

            const newData = (newCat as unknown as { customData: CatBodyData })
              .customData;
            if (newData) {
              newData.squishX = 0.8;
              newData.squishY = 1.25; // Vertical stretch pop
            }

            if (this.onMergeCallback) {
              this.onMergeCallback(nextTier, midX, midY);
            }
          }, 15);
        }
      }
    });
  }

  // Physics Step & Cat States Update
  public update(delta: number) {
    Matter.Engine.update(this.engine, delta);

    const now = performance.now();
    const bodies = Matter.Composite.allBodies(this.world);
    let anyAboveDanger = false;

    for (const body of bodies) {
      if (body.label !== 'cat') continue;
      const data = (body as unknown as { customData: CatBodyData }).customData;
      if (!data) continue;

      // 1. Recover squish back to 1.0 smoothly
      data.squishX += (1 - data.squishX) * 0.15;
      data.squishY += (1 - data.squishY) * 0.15;

      // 2. Animate Eye Blinking
      data.blinkTimer--;
      if (data.blinkTimer <= 0) {
        data.blinkProgress += 0.25;
        if (data.blinkProgress >= 1.2) {
          data.blinkProgress = 0;
          data.blinkTimer = 140 + Math.random() * 220; // Next blink in ~3-5 sec
        }
      }

      // 3. Mark settled once it hits something or moves slowly
      const speed = Matter.Vector.magnitude(body.velocity);
      if (speed < 0.5 && body.position.y > this.boxBounds.top + 80) {
        data.settled = true;
      }

      // 4. Danger Line Check:
      // Cat top edge is above the danger line
      const catTop = body.position.y - data.catTier.radius;
      if (data.settled && catTop < this.dangerLineY) {
        anyAboveDanger = true;
        if (!data.aboveDangerStartTime) {
          data.aboveDangerStartTime = now;
        } else {
          // If above danger line for >= 3 seconds -> Game Over
          const elapsed = (now - data.aboveDangerStartTime) / 1000;
          if (elapsed >= 3.0) {
            if (this.onGameOverCallback) {
              this.onGameOverCallback();
            }
          }
        }
      } else {
        data.aboveDangerStartTime = undefined;
      }
    }

    if (anyAboveDanger !== this.isDangerAlerting) {
      this.isDangerAlerting = anyAboveDanger;
      if (this.onDangerAlertCallback) {
        this.onDangerAlertCallback(anyAboveDanger);
      }
    }
  }

  public getCatBodies(): Matter.Body[] {
    return Matter.Composite.allBodies(this.world).filter(
      (b) => b.label === 'cat'
    );
  }

  public clearCats() {
    const bodies = this.getCatBodies();
    for (const b of bodies) {
      Matter.Composite.remove(this.world, b);
    }
    this.isDangerAlerting = false;
  }
}
