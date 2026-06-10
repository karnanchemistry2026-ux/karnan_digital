/**
 * ExamForge — NEET UG Question Bank (Sample)
 * Accurate questions mapped to the new NMC 2024/2025 syllabus chapters.
 */

export const QUESTIONS = [
  // Physics - Kinematics (Class 11)
  {
    id: "q_phy_kine_01",
    subject: "Physics",
    class: 11,
    chapter: "Kinematics",
    text: "A particle moves in a straight line with a constant acceleration. It changes its velocity from 10 m/s to 20 m/s while passing through a distance 135 m in t second. The value of t is:",
    options: ["10", "9", "12", "1.8"],
    correctAnswer: 1, // 9
    explanation: "Using v^2 - u^2 = 2as, we get a = (400 - 100) / (2 * 135) = 300 / 270 = 10/9 m/s^2. Then, v = u + at gives 20 = 10 + (10/9)t, so t = 9s.",
    ncertRef: "Physics Class 11, Chapter 3",
    isPro: false
  },
  
  // Chemistry - Structure of Atom (Class 11)
  {
    id: "q_chem_atom_01",
    subject: "Chemistry",
    class: 11,
    chapter: "Structure of Atom",
    text: "The number of angular nodes and radial nodes in 3s orbital are",
    options: ["0 and 2, respectively", "1 and 0, respectively", "3 and 0, respectively", "0 and 1, respectively"],
    correctAnswer: 0,
    explanation: "For 3s orbital, n = 3, l = 0. Angular nodes = l = 0. Radial nodes = (n - l - 1) = (3 - 0 - 1) = 2.",
    ncertRef: "Chemistry Class 11, Chapter 2",
    isPro: false
  },

  // Biology - Cell Structure and Function (Class 11)
  {
    id: "q_bio_cell_01",
    subject: "Biology",
    class: 11,
    chapter: "Cell Structure and Function",
    text: "Which of the following cell organelles is responsible for extracting energy from carbohydrates to form ATP?",
    options: ["Ribosome", "Chloroplast", "Mitochondrion", "Lysosome"],
    correctAnswer: 2, // Mitochondrion
    explanation: "Mitochondria are the sites of aerobic respiration. They produce cellular energy in the form of ATP.",
    ncertRef: "Biology Class 11, Chapter 8",
    isPro: false
  },

  // Biology - Genetics and Evolution (Class 12)
  {
    id: "q_bio_gen_01",
    subject: "Biology",
    class: 12,
    chapter: "Genetics and Evolution",
    text: "In a cross between a true-breeding tall pea plant with true-breeding dwarf pea plant, all the F1 offsprings are tall. This shows:",
    options: ["Law of Segregation", "Law of Independent Assortment", "Law of Dominance", "Incomplete Dominance"],
    correctAnswer: 2, // Law of Dominance
    explanation: "According to Mendel's law of dominance, in a heterozygous pair of alleles, one is dominant and the other is recessive. The dominant allele expresses itself in the F1 generation.",
    ncertRef: "Biology Class 12, Chapter 5",
    isPro: true
  }
];
