/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  color: string;
  badge: string;
  teachingProfile: {
    domain: 'chemistry' | 'mathematics' | 'electrical' | 'electronics' | 'management' | 'environmental' | 'cse';
    emphasis: string;
    styleGuide: string;
    calculationHeavy: boolean;
    hasCode: boolean;
    hasDiagrams: boolean;
    hasCaseStudies: boolean;
  };
  examDate: string; // ISO date YYYY-MM-DD
  creditWeight: number;
  availableHoursPerWeek: number;
  units: {
    id: string;
    unitNumber: number;
    title: string;
    topics: {
      id: string;
      name: string;
      subtopics: string[];
      isVerifiedAgainstSyllabus: boolean;
      confidence: 'low' | 'medium' | 'high';
      notesSnippet?: string;
      isMastered?: boolean;
    }[];
  }[];
  formulas: {
    title: string;
    formula: string;
    variables: string;
    context: string;
  }[];
}

export const INITIAL_SUBJECTS: SubjectConfig[] = [
  {
    id: 'math',
    name: 'Engineering Mathematics',
    code: 'MATH101',
    color: 'from-blue-600 to-indigo-700',
    badge: 'Calculus & Linear Algebra',
    teachingProfile: {
      domain: 'mathematics',
      emphasis: 'Theorems, rigorous derivations, intermediate steps, boundary conditions, and eigenvalue analysis.',
      styleGuide: 'Never skip intermediate arithmetic or matrix reduction steps. Show all substitutions clearly.',
      calculationHeavy: true,
      hasCode: false,
      hasDiagrams: true,
      hasCaseStudies: false,
    },
    examDate: '2026-11-18',
    creditWeight: 4,
    availableHoursPerWeek: 8,
    units: [
      {
        id: 'math-u1',
        unitNumber: 1,
        title: 'Matrices & Linear Algebra',
        topics: [
          {
            id: 'math-t1',
            name: 'Eigenvalues & Eigenvectors',
            subtopics: ['Characteristic equation |A - λI| = 0', 'Cayley-Hamilton Theorem', 'Diagonalization of symmetric matrices'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'math-t2',
            name: 'Rank of a Matrix & System of Linear Equations',
            subtopics: ['Echelon form & Normal form', 'Gauss Elimination method', 'Consistency conditions (Rouché-Capelli)'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'math-t3',
            name: 'Quadratic Forms & Canonical Reduction',
            subtopics: ['Orthogonal transformation', 'Nature of quadratic form (Definite/Indefinite)', 'Signature and index'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
      {
        id: 'math-u2',
        unitNumber: 2,
        title: 'Differential Calculus & Multivariable Functions',
        topics: [
          {
            id: 'math-t4',
            name: "Rolle's & Mean Value Theorems",
            subtopics: ["Lagrange's MVT", "Cauchy's Generalized MVT", "Taylor's & Maclaurin's expansions"],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'math-t5',
            name: "Partial Derivatives & Euler's Theorem",
            subtopics: ['Homogeneous functions', "Total derivative", "Euler's theorem for two variables"],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'math-t6',
            name: 'Maxima & Minima of Two Variables',
            subtopics: ['Saddle points & Discriminant test (rt - s²)', "Lagrange's method of undetermined multipliers"],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
        ],
      },
      {
        id: 'math-u3',
        unitNumber: 3,
        title: 'Ordinary Differential Equations (ODEs)',
        topics: [
          {
            id: 'math-t7',
            name: 'First Order Linear & Exact Differential Equations',
            subtopics: ['Integrating factors', 'Bernoulli equations', 'Orthogonal trajectories'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'math-t8',
            name: 'Higher Order Linear ODEs with Constant Coefficients',
            subtopics: ['Complementary function (CF)', 'Particular Integral (PI) shortcuts', 'Method of variation of parameters'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'Cayley-Hamilton Theorem',
        formula: 'P(A) = Aⁿ + c₁Aⁿ⁻¹ + ... + cₙI = 0',
        variables: 'A: Square matrix, P(λ): Characteristic polynomial',
        context: 'Used for computing matrix inverse A⁻¹ and high matrix powers Aᵏ.',
      },
      {
        title: "Euler's Theorem for Homogeneous Functions",
        formula: 'x(∂u/∂x) + y(∂u/∂y) = n·u',
        variables: 'u: Homogeneous function of degree n, x, y: Independent variables',
        context: 'Multivariable calculus evaluation without direct differentiation.',
      },
      {
        title: 'Discriminant for Maxima/Minima',
        formula: 'Δ = rt - s², where r = f_xx, s = f_xy, t = f_yy',
        variables: 'Δ > 0 & r < 0: Local Maximum; Δ > 0 & r > 0: Local Minimum; Δ < 0: Saddle point',
        context: 'Two-variable unconstrained optimization test.',
      },
    ],
  },
  {
    id: 'chem',
    name: 'Engineering Chemistry',
    code: 'CHEM101',
    color: 'from-emerald-600 to-teal-700',
    badge: 'Thermodynamics & Materials',
    teachingProfile: {
      domain: 'chemistry',
      emphasis: 'Chemical reactions, mechanisms, electrochemistry, water hardness calculations, corrosion engineering, and phase rule.',
      styleGuide: 'Always balance chemical reactions with phase states (aq, s, g). Provide units for Nernst potential and hardness (mg/L CaCO₃ eq).',
      calculationHeavy: true,
      hasCode: false,
      hasDiagrams: true,
      hasCaseStudies: false,
    },
    examDate: '2026-11-21',
    creditWeight: 3,
    availableHoursPerWeek: 6,
    units: [
      {
        id: 'chem-u1',
        unitNumber: 1,
        title: 'Water Technology & Hardness Analysis',
        topics: [
          {
            id: 'chem-t1',
            name: 'Water Hardness & EDTA Titration',
            subtopics: ['Temporary vs Permanent hardness', 'CaCO₃ equivalent calculation', 'EDTA titration buffer mechanism & Eriochrome Black T indicator'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'chem-t2',
            name: 'Boiler Troubles & Softening Processes',
            subtopics: ['Sludge & Scale formation', 'Caustic embrittlement', 'Zeolite & Ion-exchange demineralization'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'chem-u2',
        unitNumber: 2,
        title: 'Electrochemistry & Corrosion Engineering',
        topics: [
          {
            id: 'chem-t3',
            name: 'Nernst Equation & Reference Electrodes',
            subtopics: ['Standard Hydrogen Electrode (SHE)', 'Calomel electrode', 'EMF calculation and cell thermodynamics ΔG = -nFE'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'chem-t4',
            name: 'Mechanism of Electrochemical Corrosion',
            subtopics: ['Galvanic series & Differential aeration corrosion', 'Pilling-Bedworth ratio', 'Cathodic protection (Sacrificial anode & Impressed current)'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
        ],
      },
      {
        id: 'chem-u3',
        unitNumber: 3,
        title: 'Fuels, Combustion & Spectroscopic Techniques',
        topics: [
          {
            id: 'chem-t5',
            name: 'Calorific Value & Bomb Calorimeter',
            subtopics: ['Higher Calorific Value (HCV) vs Lower Calorific Value (LCV)', "Dulong's formula", 'Combustion flue gas Orsat analysis'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'chem-t6',
            name: 'Spectroscopy Fundamentals',
            subtopics: ["Beer-Lambert's Law", 'UV-Vis electronic transitions', 'IR vibrational stretching frequencies'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'Nernst Equation at 298 K',
        formula: 'E_cell = E°_cell - (0.0591 / n) · log₁₀(Q)',
        variables: 'E_cell: Cell potential (V), E°: Standard potential, n: Electron count, Q: Reaction quotient',
        context: 'Determines electrochemical cell voltage under non-standard concentrations.',
      },
      {
        title: 'Hardness in CaCO₃ Equivalent',
        formula: 'Hardness = (Mass of hardness causing substance in mg/L) × (50 / Equivalent weight of salt)',
        variables: 'Eq wt: Ca²⁺=20, Mg²⁺=12, CaCO₃=50, Ca(HCO₃)₂=81',
        context: 'Normalizes water hardness calculations in parts per million (ppm) or mg/L.',
      },
    ],
  },
  {
    id: 'bee',
    name: 'Basic Electrical Engineering',
    code: 'EE101',
    color: 'from-amber-600 to-orange-700',
    badge: 'Circuits, AC & Machines',
    teachingProfile: {
      domain: 'electrical',
      emphasis: 'Kirchhoff laws, Mesh/Nodal analysis, Thevenin/Norton/Superposition network theorems, single-phase AC phasors, 3-phase systems, transformers, and induction motors.',
      styleGuide: 'State reference polarities, KVL loop arrow directions, complex impedance j-notation, and phase angles explicitly.',
      calculationHeavy: true,
      hasCode: false,
      hasDiagrams: true,
      hasCaseStudies: false,
    },
    examDate: '2026-11-24',
    creditWeight: 4,
    availableHoursPerWeek: 8,
    units: [
      {
        id: 'bee-u1',
        unitNumber: 1,
        title: 'DC Circuit Analysis & Network Theorems',
        topics: [
          {
            id: 'bee-t1',
            name: 'KCL, KVL, Mesh & Nodal Analysis',
            subtopics: ['Cramer’s rule for linear systems', 'Supermesh & Supernode techniques', 'Dependent vs independent sources'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'bee-t2',
            name: "Thevenin's & Norton's Theorems",
            subtopics: ['Calculating V_th and R_th with de-energized sources', 'Norton equivalent current source', 'Maximum Power Transfer Theorem (R_L = R_th)'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'bee-u2',
        unitNumber: 2,
        title: 'Single-Phase & Three-Phase AC Fundamentals',
        topics: [
          {
            id: 'bee-t3',
            name: 'Sinusoidal Steady State & RLC Series Circuit',
            subtopics: ['Phasor representation & Impedance triangle', 'Power factor (cos φ), Active (kW), Reactive (kVAR) & Apparent (kVA) power', 'Series resonance (f₀ = 1 / (2π√LC)) and Quality Factor Q'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
          {
            id: 'bee-t4',
            name: 'Three-Phase Balanced Systems',
            subtopics: ['Star (Y) vs Delta (Δ) relations (V_L = √3 V_ph, I_L = √3 I_ph)', 'Two-wattmeter method for power measurement'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'bee-u3',
        unitNumber: 3,
        title: 'Transformers & Electrical Machines',
        topics: [
          {
            id: 'bee-t5',
            name: 'Single-Phase Transformer Operation',
            subtopics: ['EMF equation E = 4.44 f N Φ_m', 'Equivalent circuit referred to primary/secondary', 'Open-circuit (core loss) & Short-circuit (copper loss) tests'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
          {
            id: 'bee-t6',
            name: 'Three-Phase Induction Motor Principles',
            subtopics: ['Rotating magnetic field concept', 'Synchronous speed N_s = 120f / P and slip s = (N_s - N) / N_s', 'Torque-slip characteristics'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'Maximum Power Transfer Theorem',
        formula: 'P_max = V_th² / (4 · R_th)',
        variables: 'V_th: Thevenin voltage, R_th: Internal resistance, R_L = R_th',
        context: 'DC and AC resistive matching conditions.',
      },
      {
        title: 'Transformer Induced EMF',
        formula: 'E₁ = 4.44 · f · N₁ · Φ_max',
        variables: 'f: Frequency in Hz, N₁: Primary turns, Φ_max: Peak magnetic flux in Webers',
        context: 'Determines voltage induction across transformer windings.',
      },
    ],
  },
  {
    id: 'ece',
    name: 'Basic Electronic Engineering',
    code: 'EC101',
    color: 'from-violet-600 to-purple-700',
    badge: 'Semiconductors & Logic',
    teachingProfile: {
      domain: 'electronics',
      emphasis: 'Semiconductor bandgap physics, PN diodes, rectifiers, Zener regulator, BJT configurations, op-amps, Boolean algebra, logic gates, and truth tables.',
      styleGuide: 'Generate structured truth tables, transfer characteristics, operating regions (Cutoff, Active, Saturation), and clear circuit diagram schematics in text/diagram notation.',
      calculationHeavy: true,
      hasCode: false,
      hasDiagrams: true,
      hasCaseStudies: false,
    },
    examDate: '2026-11-27',
    creditWeight: 3,
    availableHoursPerWeek: 6,
    units: [
      {
        id: 'ece-u1',
        unitNumber: 1,
        title: 'Semiconductor Diodes & DC Power Supplies',
        topics: [
          {
            id: 'ece-t1',
            name: 'PN Junction Diode & V-I Characteristics',
            subtopics: ['Barrier potential, depletion region, forward & reverse bias', 'Shockley diode equation', 'Dynamic vs static resistance'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'ece-t2',
            name: 'Rectifiers & Zener Voltage Regulator',
            subtopics: ['Half-wave & Full-wave bridge rectifiers (Ripple factor γ = 0.482)', 'Capacitive filter mechanism', 'Zener breakdown & Line/Load regulation'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'ece-u2',
        unitNumber: 2,
        title: 'Bipolar Junction Transistors (BJTs) & Amplifiers',
        topics: [
          {
            id: 'ece-t3',
            name: 'BJT Configurations & Biasing',
            subtopics: ['Common Emitter (CE) input/output characteristics', 'Current gains α and β (β = α / (1 - α))', 'Voltage divider biasing & Q-point stability'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
          {
            id: 'ece-t4',
            name: 'Operational Amplifier (Op-Amp) Basics',
            subtopics: ['Ideal op-amp characteristics (Infinite gain, infinite R_in, zero R_out)', 'Virtual ground concept', 'Inverting & Non-inverting closed-loop amplifiers'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'ece-u3',
        unitNumber: 3,
        title: 'Digital Electronics & Logic Gates',
        topics: [
          {
            id: 'ece-t5',
            name: 'Logic Gates & Boolean Algebra',
            subtopics: ['Universal gates (NAND, NOR)', "De Morgan's Theorems", 'Sum of Products (SOP) & Product of Sums (POS)'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'ece-t6',
            name: 'Combinational Logic & Karnaugh Maps (K-Maps)',
            subtopics: ['2, 3, and 4-variable K-Map minimization', 'Half Adder & Full Adder design', 'Multiplexers (4:1 MUX)'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'BJT Current Gain Relation',
        formula: 'β = α / (1 - α)  and  I_C = β·I_B + I_CEO',
        variables: 'β: CE gain, α: CB gain, I_C: Collector current, I_B: Base current',
        context: 'Transistor current amplification relationship.',
      },
      {
        title: 'Non-Inverting Op-Amp Gain',
        formula: 'A_v = 1 + (R_f / R₁)',
        variables: 'A_v: Closed loop voltage gain, R_f: Feedback resistor, R₁: Input resistor to ground',
        context: 'Linear operational amplifier voltage output.',
      },
    ],
  },
  {
    id: 'mgt',
    name: 'Management Studies',
    code: 'MGT101',
    color: 'from-rose-600 to-pink-700',
    badge: 'Principles & Leadership',
    teachingProfile: {
      domain: 'management',
      emphasis: "Classical management principles, Fayol's 14 principles, Taylor's scientific management, organizational structures, motivation theories (Maslow, Herzberg), leadership styles, SWOT analysis, and project planning.",
      styleGuide: 'Generate structured case studies, comparative tables, clear numbered points, real corporate examples, and exam-ready long answer frameworks with Introduction, Points, and Conclusion.',
      calculationHeavy: false,
      hasCode: false,
      hasDiagrams: false,
      hasCaseStudies: true,
    },
    examDate: '2026-12-01',
    creditWeight: 2,
    availableHoursPerWeek: 4,
    units: [
      {
        id: 'mgt-u1',
        unitNumber: 1,
        title: 'Principles & Functions of Management',
        topics: [
          {
            id: 'mgt-t1',
            name: "Fayol's 14 Principles of Management",
            subtopics: ['Division of work, Unity of command, Unity of direction, Scalar chain', 'Comparison with F.W. Taylor’s Scientific Management', 'Managerial roles (Mintzberg)'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'mgt-t2',
            name: 'Planning & Decision-Making Frameworks',
            subtopics: ['Steps in planning process', 'SWOT & PESTEL analysis', 'Programmed vs Non-programmed decisions'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
        ],
      },
      {
        id: 'mgt-u2',
        unitNumber: 2,
        title: 'Organizational Behavior & Motivation',
        topics: [
          {
            id: 'mgt-t3',
            name: 'Theories of Motivation',
            subtopics: ["Maslow's Hierarchy of Needs", "Herzberg's Two-Factor (Hygiene vs Motivator) Theory", "McGregor's Theory X and Theory Y"],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'mgt-t4',
            name: 'Leadership & Conflict Management',
            subtopics: ['Autocratic, Democratic, and Laissez-faire leadership styles', 'Transformational vs Transactional leadership', 'Blake & Mouton Managerial Grid'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'mgt-u3',
        unitNumber: 3,
        title: 'Project Management & Engineering Economics',
        topics: [
          {
            id: 'mgt-t5',
            name: 'Critical Path Method (CPM) & PERT',
            subtopics: ['Activity-on-Node networks', 'Earliest start/finish and slack calculation', 'Project crashing and cost slope'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'PERT Expected Time (t_e)',
        formula: 't_e = (t_o + 4·t_m + t_p) / 6',
        variables: 't_o: Optimistic time, t_m: Most likely time, t_p: Pessimistic time',
        context: 'Calculates weighted average duration for uncertain project tasks.',
      },
    ],
  },
  {
    id: 'evs',
    name: 'Environmental Science',
    code: 'EVS101',
    color: 'from-emerald-500 to-green-700',
    badge: 'Ecology & Sustainability',
    teachingProfile: {
      domain: 'environmental',
      emphasis: 'Ecosystem dynamics, biogeochemical cycles, biodiversity hotspots, air/water pollution standards, greenhouse effect, ozone depletion, and Environmental Impact Assessment (EIA).',
      styleGuide: 'Use accurate environmental science terminology, cause-and-effect relationship diagrams, international conventions (Kyoto, Paris, Montreal), and structured case studies.',
      calculationHeavy: false,
      hasCode: false,
      hasDiagrams: true,
      hasCaseStudies: true,
    },
    examDate: '2026-12-04',
    creditWeight: 2,
    availableHoursPerWeek: 4,
    units: [
      {
        id: 'evs-u1',
        unitNumber: 1,
        title: 'Ecosystems & Biodiversity Conservation',
        topics: [
          {
            id: 'evs-t1',
            name: 'Structure & Function of Ecosystems',
            subtopics: ['Food chains, food webs, ecological pyramids (Energy, Biomass, Numbers)', 'Energy flow (10% law)', 'Nitrogen and Carbon biogeochemical cycles'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'evs-t2',
            name: 'Biodiversity Hotspots & Conservation',
            subtopics: ['Genetic, species, and ecosystem diversity', 'Mega-biodiversity centers & Western Ghats hotspot', 'In-situ vs Ex-situ conservation strategies'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'evs-u2',
        unitNumber: 2,
        title: 'Environmental Pollution & Control Technologies',
        topics: [
          {
            id: 'evs-t3',
            name: 'Air Pollution & Global Warming',
            subtopics: ['Primary vs Secondary pollutants (Photochemical smog, Acid rain)', 'Particulate matter control (Electrostatic precipitator, Cyclone separator)', 'Greenhouse gases and global warming potentials'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'evs-t4',
            name: 'Water Pollution & Sewage Treatment',
            subtopics: ['BOD and COD test distinctions', 'Eutrophication mechanism in water bodies', 'Primary, secondary (Activated sludge), and tertiary wastewater treatment'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'evs-u3',
        unitNumber: 3,
        title: 'Environmental Policies & Sustainable Development',
        topics: [
          {
            id: 'evs-t5',
            name: 'Environmental Impact Assessment (EIA)',
            subtopics: ['Screening, scoping, public hearing, and environment management plan (EMP)', 'ISO 14001 standards', 'Disaster management for floods & industrial hazards'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'Biochemical Oxygen Demand (BOD₅)',
        formula: 'BOD = (D₁ - D₂) × Dilution Factor',
        variables: 'D₁: Initial dissolved oxygen (mg/L), D₂: DO after 5 days incubation at 20°C',
        context: 'Measures organic pollution load in wastewater effluents.',
      },
    ],
  },
  {
    id: 'cse',
    name: 'Computer Science and Engineering',
    code: 'CSE101',
    color: 'from-cyan-600 to-blue-700',
    badge: 'C Programming & Algorithms',
    teachingProfile: {
      domain: 'cse',
      emphasis: 'C programming fundamentals, pointers, memory layout, arrays, strings, recursion, algorithm complexity, flowcharts, bitwise operations, structures, and file I/O.',
      styleGuide: 'Explain line-by-line execution, memory visualization (Stack vs Heap), pointer arithmetic, step-by-step loop tracing, and predicted compiler outputs with caveats on undefined behavior.',
      calculationHeavy: true,
      hasCode: true,
      hasDiagrams: true,
      hasCaseStudies: false,
    },
    examDate: '2026-12-08',
    creditWeight: 4,
    availableHoursPerWeek: 8,
    units: [
      {
        id: 'cse-u1',
        unitNumber: 1,
        title: 'C Programming Fundamentals & Control Flow',
        topics: [
          {
            id: 'cse-t1',
            name: 'Data Types, Operators & Precedence',
            subtopics: ['Primitive types & sizeof operator', 'Pre-increment vs Post-increment evaluation', 'Bitwise operators and shift tricks'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
          {
            id: 'cse-t2',
            name: 'Conditionals & Looping Constructs',
            subtopics: ['Dangling else problem', 'Switch statement break mechanics', 'Nested loops & break/continue in algorithm design'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'high',
          },
        ],
      },
      {
        id: 'cse-u2',
        unitNumber: 2,
        title: 'Arrays, Strings & Pointers',
        topics: [
          {
            id: 'cse-t3',
            name: 'Pointers & Memory Architecture',
            subtopics: ['Stack vs Heap memory', 'Pointer arithmetic and dereferencing', 'Pass by value vs Pass by reference in functions'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
          {
            id: 'cse-t4',
            name: 'Arrays, Strings & 2D Matrices',
            subtopics: ['Row-major order indexing', 'Null-terminated string functions (strlen, strcpy, strcmp)', 'Dynamic memory allocation (malloc, calloc, realloc, free)'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'medium',
          },
        ],
      },
      {
        id: 'cse-u3',
        unitNumber: 3,
        title: 'Structures, Recursion & Basic Algorithms',
        topics: [
          {
            id: 'cse-t5',
            name: 'Recursion & Call Stack Analysis',
            subtopics: ['Base case identification', 'Call stack trace for factorial and Tower of Hanoi', 'Tail call optimization basics'],
            isVerifiedAgainstSyllabus: true,
            confidence: 'low',
          },
          {
            id: 'cse-t6',
            name: 'Searching & Sorting Algorithms',
            subtopics: ['Linear search vs Binary search (O(log n))', 'Bubble sort & Selection sort traces', 'Time and space complexity notation (Big-O)'],
            isVerifiedAgainstSyllabus: false,
            confidence: 'low',
          },
        ],
      },
    ],
    formulas: [
      {
        title: 'Row-Major 2D Array Address Calculation',
        formula: 'Address(A[i][j]) = Base_Address + [ (i - L₁)*N₂ + (j - L₂) ] × Element_Size',
        variables: 'Base_Address: &A[0][0], N₂: Column count, Element_Size: sizeof(data_type)',
        context: 'Direct physical memory offset calculation for C multidimensional arrays.',
      },
      {
        title: 'Binary Search Worst-Case Comparisons',
        formula: 'T(n) = ⌊log₂ n⌋ + 1',
        variables: 'n: Array size of sorted elements',
        context: 'Upper bound on steps needed to locate an item or declare absent.',
      },
    ],
  },
];
