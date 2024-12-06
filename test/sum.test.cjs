// node 12 and up
//import chai from "chai"
//import sum from "../sum.js"

// below for node 10
var chai = require("chai")
var sum = require ("../sum.js")


const expect = chai.expect


describe("Sum", () => {
 it("sum of positive (3) with positive (6), expecting positive (9)", () =>{
     expect(sum(3,6)).to.equal(9)
 });
})