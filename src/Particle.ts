import {vec3, vec4} from 'gl-matrix';
import Square from './geometry/Square';

class Particle {
    // for use in Verlet integration when finding new position
    prevTime : number;
    prevPos: Array<Array<number>>;
    Pi: number = 3.1415;
    velocity: Array<Array<number>>;
    acceleration: Array<Array<number>>;
    position: Array<Array<number>>;
    // number of quads being drawn
    numParticles: number;
    boundingVal: number;
    offsetsArray: number[];
    colorsArray: number[];

    constructor() {
        // square root of number of particles to start
        this.numParticles = 100;
        this.boundingVal = this.numParticles + 8;
        this.prevTime = 0;

        this.velocity = new Array<Array<number>>();
        this.acceleration = new Array<Array<number>>();
        this.position = new Array<Array<number>>();
        this.prevPos = new Array<Array<number>>();

        this.offsetsArray = [];
        this.colorsArray = [];
        let speedScale = 4;
        // have all points initially lie in a plane
        let n = this.numParticles;
        for(let i = 0; i < n; i++) {
            for(let j = 0; j < n; j++) {
                let x = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let y = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let z = Math.random() * this.boundingVal - (this.boundingVal / 2);
                this.position.push([x, y, z]);
                this.prevPos.push([x, y, z]);
                let r1 = Math.random() * 2 * this.Pi - 1;
                let r2 = Math.random() * 2 * this.Pi - 1;
                let r3 = Math.random() * 2 * this.Pi - 1;
                this.acceleration.push([r1, r2, r3]);
                this.velocity.push([0, 0, 0]);

                this.offsetsArray.push(i);
                this.offsetsArray.push(j);
                this.offsetsArray.push(0);

                this.colorsArray.push(i / n);
                this.colorsArray.push(j / n);
                this.colorsArray.push(1.0);
                this.colorsArray.push(1.0); // Alpha channel
            }
        }
    }
    // set data of colors and offsets
    // used to set data of square instances in main.ts
    setData() {
        let n = this.numParticles;
        this.offsetsArray = [];
        this.colorsArray = [];
        for(let i = 0; i < n * n; i++) {

            this.offsetsArray.push(this.position[i][0]);
            this.offsetsArray.push(this.position[i][1]);
            this.offsetsArray.push(this.position[i][2]);

            this.colorsArray.push(0.0);
            this.colorsArray.push(1.0);
            this.colorsArray.push(1.0);
            this.colorsArray.push(1.0);
        }
    }

    // updates position data based on time and particle attributes
    update(time: number) {
        // verlet integration over each offset
        for(let i = 0; i < this.numParticles * this.numParticles; i++) {
                let newPos = vec3.create();
                vec3.add(newPos, newPos, this.position[i]);
                let changePos = vec3.create();
                vec3.subtract(changePos, this.position[i], this.prevPos[i]);
                vec3.add(newPos, newPos, changePos);
                let accelTerm = vec3.create();
                vec3.scale(accelTerm, this.acceleration[i], Math.pow(time - this.prevTime, 2));
                vec3.add(newPos, newPos, accelTerm);
                
                // set previous position to be current position
                this.prevPos[i] = [this.position[i][0], this.position[i][1], this.position[i][2]];
                 // set current position to be newly calculated position
                 if(vec3.length(newPos) > this.boundingVal) {
                     let dir = vec3.create();
                     vec3.subtract(dir, newPos, this.position[i]);
                     newPos = vec3.fromValues(this.position[i][0], this.position[i][1], this.position[i][2]);
                     vec3.normalize(dir, dir);
                     vec3.scale(dir, dir, -1);
                     vec3.scale(dir, dir, 1 / 70);
                     this.applyParticleForce(dir, i);
                 }
                this.position[i] = [newPos[0], newPos[1], newPos[2]];

        }
        this.prevTime = time;
    }

    // apply single directional force to all particles
    applyMassForce(f: vec3) {
        let mass = 9;
        for(let i = 0; i < this.numParticles * this.numParticles; i++) {
            let a = vec3.create();
            vec3.scale(a, f, 1 / mass);
            this.acceleration[i] = [a[0], a[1], a[2]];
        }
    }
    // apply a force to a single particle at index i
    applyParticleForce(f: vec3, index: number) {
        let mass = 2;
        let a = vec3.create();
        vec3.scale(a, f, 1 / mass);
        this.acceleration[index] = [a[0], a[1], a[2]];
    }

    getColors(): number[] {
        return this.colorsArray;
    }

    getOffsets(): number[] {
        return this.offsetsArray;
    }

    getNumParticles(): number {
        return this.numParticles;
    }
}

export default Particle;