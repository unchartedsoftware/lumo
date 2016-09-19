(function() {

    'use strict';

    const Complex = require('./complex');

    const ESCAPE_MODULUS = 2.3;
    const MAX_ITERATIONS = 16;

    module.exports = function(resolution, coord) {

        // Sets gray level for escape situation
        const getEscapeColour = function(numIterations) {
            let gray = 1.0 - (numIterations / MAX_ITERATIONS);
            gray = Math.max(gray, 0.1);
            return {
                r: 255 * gray,
                g: 255 * gray,
                b: 255 * gray,
                a: 255
            };
        };

        // Sets colour level for interior situation
        const getColour = function(modulus) {
            const factor = (modulus / ESCAPE_MODULUS);
            const incr = Math.log10(factor * 3.5);
            const b = Math.min(Math.abs(factor + incr), 1.0);
            const g = Math.min(Math.abs(3.0 * incr) * factor, 1.0);
            const r = Math.min(Math.abs(6.0 * incr) * factor, 1.0);
            return {
                r: 255 * r,
                g: 255 * g,
                b: 255 * b,
                a: 255
            };
        };

        const writeColor = function(buffer, row, col, color) {
            buffer[(row * resolution + col) * 4] = color.r;
            buffer[(row * resolution + col) * 4 + 1] = color.g;
            buffer[(row * resolution + col) * 4 + 2] = color.b;
            buffer[(row * resolution + col) * 4 + 3] = color.a;
        };

        const min = -2.2;
        const max = 2.2;

        const dim = Math.pow(2, coord.z);
        const scale = (max - min) / dim;
        const pixelScale = scale / resolution;
        const tileXMin = min + (coord.x * scale);
        const tileYMin = min + (coord.y * scale);

        const buffer = new Uint8Array(resolution * resolution * 4);

        // Iterate through the entire panel, pixel by pixel
        for (let row=0; row<resolution; row++) {
            // Calculate the actual y position
            const yPos = tileYMin + row * pixelScale;
            for (let col=0; col<resolution; col++) {
                // Calculate the actual x position
                const xPos = tileXMin + col * pixelScale;
                // Create the complex number for this position
                const c = new Complex(xPos, yPos);
                let z = new Complex(0, 0);
                let iterations = 0;
                let color = null;
                let escaped = false;
                let modulus = 0;
                // Iterate the fractal equation z = z*z + c until z either
                // escapes or the maximum number of iterations is reached
                do {
                    z = z.multiply(z).add(c);
                    modulus = z.abs();
                    //System.out.println(modulus);
                    escaped = modulus > ESCAPE_MODULUS;
                    iterations++;
                } while (iterations < MAX_ITERATIONS && !escaped);
                // Set the colour according to what stopped the above loop
                if (escaped) {
                    color = getEscapeColour(iterations);
                } else {
                    color = getColour(modulus);
                }
                // Write color out
                writeColor(buffer, (resolution - 1) - row, col, color);
            }
        }

        // return buffer
        return buffer;
    };

}());
