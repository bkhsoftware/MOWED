Custom Optimization Solver Concept
Objectives:

Develop a high-performance solver for linear and mixed-integer programming problems
- Aim for performance competitive with commercial solvers like Gurobi
- Focus on efficiency and scalability for large-scale problems
- Ensure compatibility with web technologies for use in MOWED

Key Components:

Core Algorithm:

- Implement advanced variants of the simplex method for linear programming
- Develop efficient branch-and-bound or cutting-plane algorithms for integer programming
- Explore modern techniques like interior point methods


Preprocessing:

- Problem reduction techniques
- Automatic reformulation for improved numerical stability


Heuristics:

- Primal heuristics for finding feasible solutions quickly
- Rounding heuristics for integer problems


Parallelization:

- Leverage multi-core CPUs and possibly GPUs
- Implement parallel branching strategies for integer problems


Numerical Stability:

- Implement robust numerical methods to handle ill-conditioned problems


Problem Input:

- Develop an efficient way to input problem data
- Consider supporting standard formats like MPS or LP


WebAssembly Compilation:

- Ensure the solver can be compiled to WebAssembly for browser-based use



Development Stages:

Research and Design:

- Study existing open-source solvers (e.g., GLPK, CLP)
- Design the overall architecture


Prototype Development:

- Implement basic simplex algorithm
- Create a simple branch-and-bound framework


Core Feature Implementation:

- Develop key algorithms and data structures
- Implement basic preprocessing and heuristics


Optimization and Tuning:

- Profile and optimize performance-critical sections
- Implement advanced features and algorithms


WebAssembly Integration:

- Compile the solver to WebAssembly
- Create JavaScript bindings


Testing and Benchmarking:

- Develop a comprehensive test suite
- Benchmark against other solvers on standard problem sets


Documentation and Open-Sourcing:

- Write detailed documentation
- Prepare the project for open-source release



Challenges:

- Algorithmic Complexity: Developing efficient algorithms for NP-hard problems
- Numerical Precision: Ensuring accuracy in floating-point computations
- Performance Optimization: Achieving competitive speed with established solvers
- WebAssembly Limitations: Working within the constraints of browser-based execution

Potential Impact:

- Advancing the field of optimization software
- Providing a powerful, open-source alternative to commercial solvers
- Enabling more efficient solutions to real-world optimization problems
- Fostering innovation in browser-based optimization tools

