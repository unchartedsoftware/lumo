(function() {

    'use strict';

    class Complex {
        constructor(real = 0, imaginary = 0) {
            this.real = real;
            this.imaginary = imaginary;
        }
        add(other) {
            const x = this.real + other.real;
            const y = this.imaginary + other.imaginary;
            return new Complex(x, y);
        }
        multiply(other) {
            const x = this.real * other.real - this.imaginary * other.imaginary;
            const y = this.real * other.imaginary + this.imaginary * other.real;
            return new Complex(x, y);
        }
        abs() {
            return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
        }
    }

    module.exports = Complex;

}());
