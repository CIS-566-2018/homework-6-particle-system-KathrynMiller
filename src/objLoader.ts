import {vec3, vec4} from 'gl-matrix';

// class to load obj files for purpose of particle hw
// only need to know vertices and normals for purpose of the lsystem
class objLoader {

    reader: FileReader = new FileReader();
    vertices: number[][] = new Array<Array<number>>();
    extraVertices: number[][] = new Array<Array<number>>();
    constructor() {
    }
   
parse(filePath: string): string {
    let file: string = " ";
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", filePath, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {       
                file = rawFile.responseText;
                return file;

            }
        }
    }
    rawFile.send(null);
    return file;
}

load(filePath: string) {
  let file : string;
  this.vertices = new Array<Array<number>>();
  this.extraVertices = new Array<Array<number>>();

  file = this.parse(filePath);
  var lines = file.split("\n");
  for(let i = 0; i < lines.length; i++) {
    var line = lines[i];
    var chunks = line.split(" ");
    if(chunks[0] == "v") { // vertex data
       this.vertices.push([parseFloat(chunks[1]), parseFloat(chunks[2]), parseFloat(chunks[3]), 1]);   
    } else if (chunks[0] == "f") { // face data, use for adding new points within each triangle
        var face = [];
        // split each chunk by / to obtain just the vertex order for indices
        for(let j = 1; j < chunks.length; j++) {
          var data = chunks[j].split("/");
          face.push(data[0]);
        } 
         //triangulate faces and add random point in middle of each triangle to list of vertices
         //triangle 1
         this.addNewVertex(this.vertices[parseInt(face[0]) - 1], this.vertices[parseInt(face[1]) - 1], this.vertices[parseInt(face[2]) - 1]);
         if(face.length > 3) { // account for some triangular faces in obj file that don't need to be triangulated
         this.addNewVertex(this.vertices[parseInt(face[0]) - 1], this.vertices[parseInt(face[2]) - 1], this.vertices[parseInt(face[3]) - 1]);
         }
      }
  }
  this.vertices = this.vertices.concat(this.extraVertices);
}

// add a new vertex within a triangle
addNewVertex(a: number[], b: number[], c: number[]) {
    let A = vec3.fromValues(a[0], a[1], a[2]);
    let B = vec3.fromValues(b[0], b[1], b[2]);
    let C = vec3.fromValues(c[0], c[1], c[2]);
    let r1 = Math.random();
    let r2 = Math.random();
    let x = (1 - Math.sqrt(r1)) * A[0] + (Math.sqrt(r1) * (1 - r2)) * B[0] + (Math.sqrt(r1) * r2) * C[0];
    let y = (1 - Math.sqrt(r1)) * A[1] + (Math.sqrt(r1) * (1 - r2)) * B[1] + (Math.sqrt(r1) * r2) * C[1];
    let z = this.zInterp(vec3.fromValues(x, y, 0), A, B, C);
    this.extraVertices.push([x, y, z]);
}

getPositions(): number[][] {
  return this.vertices;
}

// returns properly interpolated z coordinate of p within triangle made of p1, p2, p3
zInterp(p: vec3, p1: vec3, p2: vec3, p3: vec3): number {
    let s =  this.getArea(p1, p2, p3);
    let s1 = this.getArea(p, p2, p3);
    let s2 = this.getArea(p, p3, p1);
    let s3 = this.getArea(p, p1, p2);

    let z = 1 / (s1 / (p1[2] * s) + s2 / (p2[2] * s) + s3 / (p3[2] * s));

    return z;
}

// returns area of triangle made of p1, p2, p3
getArea(p1: vec3, p2: vec3, p3: vec3): number {
    let u1 = vec3.create();
    let u2 = vec3.create();

    vec3.subtract(u1, p1, p2);
    vec3.subtract(u2, p3, p2);

    u1[2] = u2[2] = 0;

    let prod = vec3.create();
    vec3.cross(prod, u1, u2);
    let area = 0.5 * vec3.length(prod);
    return area;

}
    

}

export default objLoader;