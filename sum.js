/**
 * Sums two numbers
 * @param {number} augend The first number in an addition.
 * @param {number} addend The second number in an addition.
 * @returns {number} Returns the total.
 */

 function sum(augend, addend){
     return augend + addend
 }

 // use export with node 12 and up
 //export default sum

 // use module.exports for node 10 or below
 module.exports = sum