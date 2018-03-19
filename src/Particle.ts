import {vec3, vec4} from 'gl-matrix';
import Square from './geometry/Square';

class Particle {
    // for use in Verlet integration when finding new position
    prevTime : number;
    prevPos: Array<Array<number>>;
    Pi: number = 3.1415;

    position: Array<Array<number>>;
    // number of quads being drawn
    numParticles: number;
    boundingVal: number;
    offsetsArray: number[];
    colorsArray: number[];

    // used for separating particles into bins of colors
    // if there is a target (attract or repel), base color on dist from target
    // otherwise based on distance from center
    maxCol: number = -1000000000000;
    minCol: number = 1000000000000; 

    color1: number[] = [232.0 / 255.0, 131.0 / 255.0, 214.0 / 255.0, 1.0];
    color2: number[] = [255.0 / 255.0, 183.0 / 255.0, 150.0 / 255.0, 1.0];
    color3: number[] = [137.0 / 255.0, 255.0 / 255.0, 133.0 / 255.0, 1.0];
    color4: number[] = [131.0 / 255.0, 227.0 / 255.0, 232.0 / 255.0, 1.0];
    color5: number[] = [138.0 / 255.0, 131.0 / 255.0, 255.0 / 255.0, 1.0];
    palette: Array<Array<number>> = [this.color1, this.color2, this.color3, this.color4, this.color5];

    constructor() {
        // square root of number of particles to start
        this.numParticles = 50;
        this.boundingVal = 100;
        this.prevTime = 0;

        this.position = new Array<Array<number>>();
        this.prevPos = new Array<Array<number>>();

        this.offsetsArray = [];
        this.colorsArray = [];
        let speedScale = 4;
        // have all points initially lie in a plane
        let n = this.numParticles;
        for(let i = 0; i < n; i++) {
            for(let j = 0; j < n; j++) {
                // generate random starting velocity for points
                let x = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let y = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let z = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let x2 = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let y2 = Math.random() * this.boundingVal - (this.boundingVal / 2);
                let z2 = Math.random() * this.boundingVal - (this.boundingVal / 2);
                this.position.push([x, y, z]);
                this.prevPos.push([x2, y2, z2]);
                let r1 = Math.random() * 2 * this.Pi - 1;
                let r2 = Math.random() * 2 * this.Pi - 1;
                let r3 = Math.random() * 2 * this.Pi - 1;

                this.offsetsArray.push(x);
                this.offsetsArray.push(y);
                this.offsetsArray.push(z);

                this.colorsArray.push(i / n);
                this.colorsArray.push(j / n);
                this.colorsArray.push(1.0);
                this.colorsArray.push(1.0); // Alpha channel
            }
        }
    }
    // set data of colors and offsets
    // used to set data of square instances in main.ts
    setData(target: vec3, attract: boolean, repel: boolean) {
        let n = this.numParticles;
        this.offsetsArray = [];
        this.colorsArray = [];
        let colorRange = this.boundingVal / 20.0;
        let targetDist = vec3.create();
        let color = [];
        // make target center is there is no user inpute
        if(!attract && !repel) {
            target = vec3.create();
        }
        for(let i = 0; i < n * n; i++) {

            this.offsetsArray.push(this.position[i][0]);
            this.offsetsArray.push(this.position[i][1]);
            this.offsetsArray.push(this.position[i][2]);
            
            vec3.subtract(targetDist, this.position[i], target);
            let colorIdx = vec3.length(targetDist) % colorRange;
            color = this.palette[Math.floor(colorIdx)];

                 this.colorsArray.push(color[0]);
                 this.colorsArray.push(color[1]);
                 this.colorsArray.push(color[2]);
                 this.colorsArray.push(1.0);
            
        }
    }

    // updates position data based on time and particle attributes
    update(time: number, target: vec3, strength: number, attract: boolean, repel: boolean, vertices: number[][], mesh: boolean) {
        // verlet integration over each offset
        for(let i = 0; i < this.numParticles * this.numParticles; i++) {               
                let newPos = vec3.create();
                let changePos = vec3.create();
                let accelTerm = vec3.create();
                let acceleration = vec3.create();

                // p + (p - p*)
                vec3.add(newPos, newPos, this.position[i]);
                vec3.subtract(changePos, this.position[i], this.prevPos[i]);
                vec3.add(newPos, newPos, changePos);
                
                let currPos = vec3.fromValues(this.position[i][0], this.position[i][1], this.position[i][2]);
                // set previous position to be current position
                this.prevPos[i] = [this.position[i][0], this.position[i][1], this.position[i][2]];

                // if there is a desired target (mouseclick etc.)
                if(attract) {
                    let attraction = vec3.create();
                    vec3.scale(attraction, this.attractTarget(target, strength, newPos, currPos), 1 / 50);
                    vec3.add(acceleration, acceleration, attraction);

                } else if (repel) {
                    let repelForce = vec3.create();
                    vec3.scale(repelForce, this.repelTarget(target, strength, newPos, currPos), 1 / 50);
                    vec3.add(acceleration, acceleration, repelForce);
                } 

                // see if particle should form to mesh
                if(mesh) {
                    if(i < vertices.length) {
                        let meshForce = vec3.create();
                        let vertex = vec3.fromValues(vertices[i][0], vertices[i][1], vertices[i][2]);
                        vec3.scale(meshForce, this.attractTarget(vertex, 2, newPos, currPos), 1 / 10);
                        vec3.add(acceleration, acceleration, meshForce);
                    }
                }

                // if particle is at edge of bounding box, reverse direction
                 if(vec3.length(newPos) > this.boundingVal) {
                    let dir = vec3.create();
                    let offset = vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
                    vec3.scale(offset, offset, .2); // offset for non-linear force direction
                    // vector in direction of motion
                    vec3.subtract(dir, newPos, this.position[i]);
                    newPos = vec3.fromValues(this.position[i][0], this.position[i][1], this.position[i][2]);
                    vec3.normalize(dir, dir);
                    // negate to send in opposite direction
                    vec3.scale(dir, dir, -1);
                    vec3.scale(dir, dir, 1 / 10);
                    vec3.add(dir, offset, dir);
                    acceleration = this.applyParticleForce(dir);
                    //vec3.add(acceleration, acceleration, this.applyParticleForce(dir));
                }

                // at^2 term
                vec3.scale(accelTerm, acceleration, Math.pow(time - this.prevTime, 2));
                vec3.add(newPos, newPos, accelTerm);

                // set current position to be newly calculated position
                this.position[i] = [newPos[0], newPos[1], newPos[2]];
        }
        this.prevTime = time;

        // pass data to final arrays
        //this.setData(target, attract, repel);
    }

    formMesh(vertices: number[][], time: number, target: vec3, attract: boolean, repel: boolean) {

        let i = 0;
        for(i = 0; i < vertices.length; i++) {
            let newPos = vec3.create();
            let changePos = vec3.create();
            let accelTerm = vec3.create();
            let acceleration = vec3.create();

            let currPos = vec3.fromValues(this.position[i][0], this.position[i][1], this.position[i][2]);
            let vertex = vec3.fromValues(vertices[i][0], vertices[i][1], vertices[i][2]);
            // p + (p - p*)
            vec3.add(newPos, newPos, this.position[i]);
            vec3.subtract(changePos, this.position[i], this.prevPos[i]);
            vec3.add(newPos, newPos, changePos);

            acceleration = this.attractTarget(vertex, 2, newPos, currPos);
            vec3.scale(acceleration, acceleration, 1/ 10);
            // at^2 term
            vec3.scale(accelTerm, acceleration, Math.pow(time - this.prevTime, 2));
            vec3.add(newPos, newPos, accelTerm);

            this.prevPos[i] = [currPos[0], currPos[1], currPos[2]];
            // set current position to be newly calculated position
            this.position[i] = [newPos[0], newPos[1], newPos[2]];
        }
        for(let j = i; j < this.position.length; j++) {
           // this.update(time, target, 50, attract, repel);
        }
        this.prevTime = time;
       // this.setData(vec3.create(), false, false);
    }

    // particles are attracted to source, p, based on strength input
    // returns acceleration towards target
    attractTarget(target: vec3, strength: number, newPos: vec3, currPos: vec3): vec3 {
        //TODO make based on strength
        // maximum distance particles can stray
        let maxRad = strength;
        let targetVec = vec3.create(); // vector from particle to target
        let currDir = vec3.create();
        let dif = vec3.create();

        vec3.subtract(currDir, newPos, currPos);
        vec3.subtract(targetVec, target, newPos);
        
        // if already heading towards the center, don't apply acceleration again
        if(vec3.dot(currDir, targetVec) > 0) {
            return vec3.create();
        } else { // if heading away from target
            if(vec3.length(targetVec) > maxRad) { // if outside maxRad change direction
                return this.applyParticleForce(targetVec);
            } else { // if heading away but inside maxRadius
                let radius = Math.abs(Math.random() - Math.random()) * maxRad; // radius between 0 and maxRad
                 // switch direction if straying outside of this "spring" from target
                if(vec3.length(targetVec) > radius) {
                    return this.applyParticleForce(targetVec);
                }
            }
        }
        return vec3.create();
    }

    repelTarget(target: vec3, strength: number, newPos: vec3, currPos: vec3) {
        //TODO make based on strength
        // maximum distance particles can stray
        let minRad = 20;
        let targetVec = vec3.create(); // vector from particle to target
        let currDir = vec3.create();
        let dif = vec3.create();

        vec3.subtract(currDir, newPos, currPos);
        vec3.subtract(targetVec, newPos, target);

        vec3.subtract(dif, target, newPos);
        
        // if inside circle
        if(vec3.length(dif) < minRad) {
            if(vec3.dot(targetVec, newPos) > 0) { // heading away from center
                return this.applyParticleForce(targetVec);
            } else { // heading towards center
                return this.applyParticleForce(targetVec);
            } 
        } 
        return vec3.create();
    }

    // apply a force to a single particle at index i
    // returns the acceleration of the particle
    applyParticleForce(f: vec3): vec3 {
        let mass = 2;
        let a = vec3.create();
        vec3.scale(a, f, 1 / mass);
        return vec3.fromValues(a[0], a[1], a[2]);
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