var sliderPositions = {
    R: 0,
    T: 0,
};

var points = {
    P0: [-12.09,-5, 10.71], //A
    P1: [-17.38,-5, 27.9], //B
    P2: [-7.19, -5, 22.81], //C
    P3: [3.05, -5, 23.57], //D

    P4: [13.29, -10, 24.33], //E
    
    P5: [25.36, -10, 24.33], //F
    P6: [22.78, -10, 6.75],  //G

    P7: [20.21, -10, -15.17], //H

    P8: [5.03, -10, -55.78],  //I
    P9: [-9.96, -7, -43.98],  //J

    P10: [-24.95, -10, -26.57], //O

    P11: [-5.86, -10, -5.17], //P
    P12: [-12.09, -5, 10.71], //Q
};


// Função para interpolar coordenadas
function interpolateCoordinate(coord, targetCoord, t) {
    // Interpolate a single coordinate using the formula: coord + t * (targetCoord - coord)
    return coord + t * (targetCoord - coord);
}

function calculatePoint(points, t) {
    const segmentIndex = Math.floor(t * 4); // Determine which segment t falls into
    const segmentT = t * 4 - segmentIndex; // Rescale t within the segment

    const startIndex = segmentIndex * 3; // Index of the starting point for the current segment
    const X = points[`P${startIndex}`];
    const Y = points[`P${startIndex + 1}`];
    const Z = points[`P${startIndex + 2}`];
    const W = points[`P${startIndex + 3}`];

    // Interpolate coordinates for each point in the segment
    const A = X.map((coord, index) =>
        interpolateCoordinate(coord, Y[index], segmentT)
    );
    const B = Y.map((coord, index) =>
        interpolateCoordinate(coord, Z[index], segmentT)
    );
    const C = Z.map((coord, index) =>
        interpolateCoordinate(coord, W[index], segmentT)
    );

    const D = A.map((coord, index) =>
        interpolateCoordinate(coord, B[index], segmentT)
    );
    const BC = B.map((coord, index) =>
        interpolateCoordinate(coord, C[index], segmentT)
    );

    const ABC = D.map((coord, index) =>
        interpolateCoordinate(coord, BC[index], segmentT)
    );

    // Multiply each coordinate by 10 and return
    return ABC.map((element) => 10 * element);
}

function Tangente(points, t) {
    const segmentIndex = Math.floor(t * 4);
    const segmentT = t * 4 - segmentIndex;

    const startIndex = segmentIndex * 3;
    const X = points[`P${startIndex}`];
    const Y = points[`P${startIndex + 1}`];
    const Z = points[`P${startIndex + 2}`];
    const W = points[`P${startIndex + 3}`];

    const A = X.map((coord, index) =>
    interpolateCoordinate(coord, Y[index], segmentT)
    );
    const B = Y.map((coord, index) =>
    interpolateCoordinate(coord, Z[index], segmentT)
    );
    const C = Z.map((coord, index) =>
    interpolateCoordinate(coord, W[index], segmentT)
    );
    const ABC = B.map((coord, index) =>
    interpolateCoordinate(coord, C[index], segmentT)
    );

    return ABC.map((element) => 10 * element);
}