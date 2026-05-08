/**
 * Este arquivo contém os dados dos PPCs dos cursos de Ciência da Computação (oficial), Engenharia da Computação (não oficial) e Inteligência Artificial (não oficial)
 * Ele é importado na tela de exploração de planejamento para exibir as disciplinas e seus pré-requisitos.
 */
const PPC_DATA = Object.freeze({
    "ciencia-computacao": {
        nome: "Ciência da Computação",
        anoPpc: 2019,
        periodos: [
            {
                numero: 1,
                disciplinas: [
                    { codigo: "COMP359", nome: "Programação 1", ch: 72, prerequisitos: [] },
                    { codigo: "COMP360", nome: "Lógica para Computação", ch: 72, prerequisitos: [] },
                    { codigo: "COMP361", nome: "Computação, Sociedade e Ética", ch: 72, prerequisitos: [] },
                    { codigo: "COMP362", nome: "Matemática Discreta", ch: 72, prerequisitos: [] },
                    { codigo: "COMP363", nome: "Cálculo Diferencial e Integral", ch: 144, prerequisitos: [] }
                ]
            },
            {
                numero: 2,
                disciplinas: [
                    { codigo: "COMP364", nome: "Estrutura de Dados", ch: 72, prerequisitos: ["COMP359"] },
                    { codigo: "COMP365", nome: "Banco de Dados", ch: 72, prerequisitos: [] },
                    { codigo: "COMP366", nome: "Organização e Arquitetura de Computadores", ch: 72, prerequisitos: [] },
                    { codigo: "COMP367", nome: "Geometria Analítica", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA", nome: "Eletiva", ch: 72, prerequisitos: [] }
                ]
            },
            {
                numero: 3,
                disciplinas: [
                    { codigo: "COMP368", nome: "Redes de Computadores", ch: 72, prerequisitos: ["COMP359"] },
                    { codigo: "COMP369", nome: "Teoria dos Grafos", ch: 72, prerequisitos: ["COMP364", "COMP362"] },
                    { codigo: "COMP370", nome: "Probabilidade e Estatística", ch: 72, prerequisitos: ["COMP363"] },
                    { codigo: "COMP371", nome: "Álgebra Linear", ch: 72, prerequisitos: ["COMP367"] },
                    { codigo: "ELETIVA", nome: "Eletiva", ch: 72, prerequisitos: [] }
                ]
            },
            {
                numero: 4,
                disciplinas: [
                    { codigo: "COMP372", nome: "Programação 2 (correq.: COMP373)", ch: 72, prerequisitos: ["COMP364", "COMP365", "COMP368"] },
                    { codigo: "COMP373", nome: "Programação 3 (correq.: COMP372)", ch: 72, prerequisitos: ["COMP364", "COMP365", "COMP368"] },
                    { codigo: "COMP374", nome: "Projeto e Análise de Algoritmos", ch: 72, prerequisitos: ["COMP364", "COMP369"] },
                    { codigo: "COMP376", nome: "Teoria da Computação", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "COMP377", nome: "Prática de Extensão 1", ch: 75, prerequisitos: [] }
                ]
            },
            {
                numero: 5,
                disciplinas: [
                    { codigo: "COMP378", nome: "Sistemas Operacionais", ch: 72, prerequisitos: ["COMP366"] },
                    { codigo: "COMP379", nome: "Compiladores", ch: 72, prerequisitos: ["COMP364", "COMP376"] },
                    { codigo: "COMP380", nome: "Inteligência Artificial", ch: 72, prerequisitos: ["COMP360", "COMP364"] },
                    { codigo: "COMP381", nome: "Computação Gráfica", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "COMP383", nome: "Prática de Extensão 2", ch: 75, prerequisitos: [] }
                ]
            },
            {
                numero: 6,
                disciplinas: [
                    { codigo: "COMP382", nome: "Projeto e Desenvolvimento de Sistemas", ch: 288, prerequisitos: ["Todas do 1º ao 5º período"] },
                    { codigo: "ELETIVA", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "COMP384", nome: "Prática de Extensão 3", ch: 75, prerequisitos: [] }
                ]
            },
            {
                numero: 7,
                disciplinas: [
                    { codigo: "COMP386", nome: "Metodologia de Pesquisa e Trabalho Individual", ch: 72, prerequisitos: [] },
                    { codigo: "COMP387", nome: "Noções de Direito", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA I", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA II", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA III", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "COMP388", nome: "Prática de Extensão 4", ch: 75, prerequisitos: [] }
                ]
            },
            {
                numero: 8,
                disciplinas: [
                    { codigo: "ELETIVA I", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA II", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA III", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA IV", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "ELETIVA V", nome: "Eletiva", ch: 72, prerequisitos: [] },
                    { codigo: "COMP385", nome: "Prática de Extensão 5", ch: 75, prerequisitos: [] }
                ]
            }
        ]
    },
    "engenharia-computacao": {
        nome: "Engenharia da Computação",
        anoPpc: 2026,
        periodos: [
            {
                numero: 1,
                disciplinas: [
                    { codigo: "ENGC100", nome: "Introdução à Engenharia da Computação", ch: 60, prerequisitos: [] },
                    { codigo: "MAT100", nome: "Cálculo I", ch: 60, prerequisitos: [] },
                    { codigo: "FIS100", nome: "Física I", ch: 60, prerequisitos: [] },
                    { codigo: "COMP101", nome: "Algoritmos e Programação", ch: 60, prerequisitos: [] }
                ]
            },
            {
                numero: 2,
                disciplinas: [
                    { codigo: "MAT120", nome: "Álgebra Linear", ch: 60, prerequisitos: [] },
                    { codigo: "FIS120", nome: "Física II", ch: 60, prerequisitos: ["FIS100"] },
                    { codigo: "ENGC120", nome: "Circuitos Elétricos I", ch: 60, prerequisitos: [] },
                    { codigo: "COMP120", nome: "Programação Estruturada", ch: 60, prerequisitos: ["COMP101"] }
                ]
            },
            {
                numero: 3,
                disciplinas: [
                    { codigo: "ENGC200", nome: "Circuitos Elétricos II", ch: 60, prerequisitos: ["ENGC120"] },
                    { codigo: "ENGC210", nome: "Eletrônica I", ch: 60, prerequisitos: ["ENGC120"] },
                    { codigo: "COMP200", nome: "Estruturas de Dados", ch: 60, prerequisitos: ["COMP120"] },
                    { codigo: "MAT200", nome: "Equações Diferenciais", ch: 60, prerequisitos: ["MAT100"] }
                ]
            },
            {
                numero: 4,
                disciplinas: [
                    { codigo: "ENGC220", nome: "Eletrônica II", ch: 60, prerequisitos: ["ENGC210"] },
                    { codigo: "ENGC230", nome: "Sistemas Digitais", ch: 60, prerequisitos: ["COMP200"] },
                    { codigo: "ENGC240", nome: "Sinais e Sistemas", ch: 60, prerequisitos: ["MAT200", "FIS120"] },
                    { codigo: "COMP240", nome: "POO para Engenharia", ch: 60, prerequisitos: ["COMP120"] }
                ]
            },
            {
                numero: 5,
                disciplinas: [
                    { codigo: "ENGC300", nome: "Microprocessadores", ch: 60, prerequisitos: ["ENGC230"] },
                    { codigo: "ENGC310", nome: "Controle e Automação", ch: 60, prerequisitos: ["ENGC240"] },
                    { codigo: "COMP300", nome: "Sistemas Operacionais", ch: 60, prerequisitos: ["COMP200"] },
                    { codigo: "COMP320", nome: "Redes de Computadores", ch: 60, prerequisitos: ["COMP240"] }
                ]
            },
            {
                numero: 6,
                disciplinas: [
                    { codigo: "ENGC330", nome: "Sistemas Embarcados", ch: 60, prerequisitos: ["ENGC300"] },
                    { codigo: "ENGC340", nome: "Instrumentação", ch: 60, prerequisitos: ["ENGC310"] },
                    { codigo: "COMP340", nome: "Banco de Dados", ch: 60, prerequisitos: ["COMP240"] }
                ]
            },
            {
                numero: 7,
                disciplinas: [
                    { codigo: "ENGC400", nome: "Projeto de Hardware", ch: 60, prerequisitos: ["ENGC330"] },
                    { codigo: "COMP410", nome: "Engenharia de Software", ch: 60, prerequisitos: ["COMP300"] },
                    { codigo: "ENGC420", nome: "Projeto Integrador I", ch: 60, prerequisitos: ["ENGC340"] }
                ]
            },
            {
                numero: 8,
                disciplinas: [
                    { codigo: "ENGC430", nome: "Internet das Coisas", ch: 60, prerequisitos: ["ENGC330", "COMP320"] },
                    { codigo: "ENGC490", nome: "Projeto Integrador II", ch: 60, prerequisitos: ["ENGC420"] },
                    { codigo: "ENGC499", nome: "Trabalho de Conclusão de Curso", ch: 60, prerequisitos: ["ENGC490"] }
                ]
            }
        ]
    },
    "inteligencia-artificial": {
        nome: "Inteligência Artificial",
        anoPpc: 2026,
        periodos: [
            {
                numero: 1,
                disciplinas: [
                    { codigo: "IA100", nome: "Fundamentos de Inteligência Artificial", ch: 60, prerequisitos: [] },
                    { codigo: "COMP101", nome: "Programação I", ch: 60, prerequisitos: [] },
                    { codigo: "MAT100", nome: "Cálculo I", ch: 60, prerequisitos: [] },
                    { codigo: "MAT110", nome: "Álgebra Linear", ch: 60, prerequisitos: [] }
                ]
            },
            {
                numero: 2,
                disciplinas: [
                    { codigo: "IA120", nome: "Representação de Conhecimento", ch: 60, prerequisitos: ["IA100"] },
                    { codigo: "COMP120", nome: "Programação II", ch: 60, prerequisitos: ["COMP101"] },
                    { codigo: "MAT120", nome: "Probabilidade", ch: 60, prerequisitos: ["MAT100"] },
                    { codigo: "IA130", nome: "Laboratório de IA I", ch: 60, prerequisitos: ["IA100"] }
                ]
            },
            {
                numero: 3,
                disciplinas: [
                    { codigo: "IA200", nome: "Aprendizado de Máquina I", ch: 60, prerequisitos: ["MAT120", "COMP120"] },
                    { codigo: "IA210", nome: "Mineração de Dados", ch: 60, prerequisitos: ["COMP120"] },
                    { codigo: "COMP200", nome: "Estruturas de Dados", ch: 60, prerequisitos: ["COMP120"] },
                    { codigo: "MAT200", nome: "Otimização", ch: 60, prerequisitos: ["MAT110", "MAT120"] }
                ]
            },
            {
                numero: 4,
                disciplinas: [
                    { codigo: "IA220", nome: "Aprendizado Profundo", ch: 60, prerequisitos: ["IA200"] },
                    { codigo: "IA230", nome: "Processamento de Linguagem Natural", ch: 60, prerequisitos: ["IA200"] },
                    { codigo: "IA240", nome: "Visão Computacional", ch: 60, prerequisitos: ["IA200"] },
                    { codigo: "COMP240", nome: "Banco de Dados para IA", ch: 60, prerequisitos: ["COMP200"] }
                ]
            },
            {
                numero: 5,
                disciplinas: [
                    { codigo: "IA300", nome: "Aprendizado de Máquina II", ch: 60, prerequisitos: ["IA220"] },
                    { codigo: "IA310", nome: "MLOps", ch: 60, prerequisitos: ["IA220", "COMP240"] },
                    { codigo: "IA320", nome: "Sistemas Multiagentes", ch: 60, prerequisitos: ["IA120"] },
                    { codigo: "IA330", nome: "Ética em IA", ch: 60, prerequisitos: [] }
                ]
            },
            {
                numero: 6,
                disciplinas: [
                    { codigo: "IA340", nome: "IA Generativa", ch: 60, prerequisitos: ["IA220", "IA230"] },
                    { codigo: "IA350", nome: "Laboratório de IA II", ch: 60, prerequisitos: ["IA130", "IA300"] }
                ]
            },
            {
                numero: 7,
                disciplinas: [
                    { codigo: "IA410", nome: "Projeto Integrador em IA", ch: 60, prerequisitos: ["IA350"] },
                    { codigo: "IA420", nome: "Segurança e Robustez de Modelos", ch: 60, prerequisitos: ["IA300"] },
                    { codigo: "IA430", nome: "Empreendedorismo em IA", ch: 60, prerequisitos: [] }
                ]
            },
            {
                numero: 8,
                disciplinas: [
                    { codigo: "IA490", nome: "Trabalho de Conclusão de Curso", ch: 60, prerequisitos: ["IA410"] },
                    { codigo: "IA499", nome: "Estágio Supervisionado", ch: 120, prerequisitos: ["IA410"] }
                ]
            }
        ]
    }
});