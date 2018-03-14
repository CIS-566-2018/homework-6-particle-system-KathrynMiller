import {vec3, vec4} from 'gl-matrix';
import Square from './geometry/Square';

class Particle {
    velocity: vec3;
    acceleration: vec3;
    position: vec3;
    // number of quads being drawn
    numParticles: number;
    offsetsArray: number[] = [];
    colorsArray: number[] = [];

    constructor() {
        this.numParticles = 100;
    }
    // set data of colors and offsets
    // used to set data of square instances in main.ts
    setData() {
        let n: number = 100.0;
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