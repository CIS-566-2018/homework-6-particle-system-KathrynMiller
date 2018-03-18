

// class to load obj files for purpose of particle hw
// only need to know vertices and normals for purpose of the lsystem
class objLoader {

    reader: FileReader = new FileReader();
    vertices: number[][] = new Array<Array<number>>();

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

  file = this.parse(filePath);
  var lines = file.split("\n");
  for(let i = 0; i < lines.length; i++) {
    var line = lines[i];
    var chunks = line.split(" ");
    if(chunks[0] == "v") { // vertex data
       this.vertices.push([parseFloat(chunks[1]), parseFloat(chunks[2]), parseFloat(chunks[3]), 1]);   
    }
  }
}

getPositions(): number[][] {
  return this.vertices;
}
    

}

export default objLoader;