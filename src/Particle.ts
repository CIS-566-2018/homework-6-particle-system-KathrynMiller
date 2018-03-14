import {vec3, vec4} from 'gl-matrix';
import Square from './geometry/Square';

class Particle {
    // for use in Verlet integration when finding new position
    prevTime : number;
    prevPos: Array<Array<number>>;

    velocity: Array<Array<number>>;
    acceleration: Array<Array<number>>;
    position: Array<Array<number>>;
    // number of quads being drawn
    numParticles: number;
    offsetsArray: number[];
    colorsArray: number[];

    constructor() {
        this.numParticles = 10;

        this.velocity = new Array<Array<number>>();
        this.acceleration = new Array<Array<number>>();
        this.position = new Array<Array<number>>();
        this.prevPos = new Array<Array<number>>();

        this.offsetsArray = [];
        this.colorsArray = [];

        // have all points initially lie in a plane
        let n = this.numParticles;
        for(let i = 0; i < n; i++) {
            for(let j = 0; j < n; j++) {
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
        for(let i = 0; i < n; i++) {
            for(let j = 0; j < n; j++) {
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

    // updates position data based on time and particle attributes
    update(time: number) {
        // verlet integration over each offset
        for(let i = 0; i < this.numParticles; i++) {
                let newPos = vec3.create();
                vec3.add(newPos, newPos, this.position[i]);
                let changePos = vec3.create();
                vec3.subtract(changePos, this.prevPos[i], this.position[i]);
                vec3.add(newPos, newPos, changePos);
                let accelTerm = vec3.create();
                vec3.scale(accelTerm, this.acceleration[i], Math.pow(time - this.prevTime, 2));

                // set previous position to be current position
                this.prevPos[i] = [this.position[i][0], this.position[i][1], this.position[i][2]];
                // don't let particles go beyond box of this value
                let boundingVal = 4;
                vec3.max(newPos, newPos, vec3.fromValues(0, 0, 0));
                vec3.min(newPos, newPos, vec3.fromValues(boundingVal, boundingVal, boundingVal));
                 // set current position to be newly calculated position
                this.position[i] = [newPos[0], newPos[1], newPos[2]];
        }
        this.prevTime = time;
    }

    applyForce(f: vec3) {
        let mass = 1 / 2;
        for(let i = 0; i < this.numParticles; i++) {
            let a = vec3.create();
            vec3.scale(a, f, mass);
            this.acceleration[i] = [a[0], a[1], a[2]];
        }
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