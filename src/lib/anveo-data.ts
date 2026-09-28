export const stages = ["Novo Lead", "Contato realizado", "Qualificado", "Proposta", "Negociação", "Ganho", "Perdido"] as const;
export type Stage = (typeof stages)[number];
export type Lead = { id:string; name:string; company:string; initials:string; source:string; owner:string; stage:Stage; value:number; probability:number; temperature:"Quente"|"Morno"|"Frio"; last:string; next:string; email:string; phone:string; tags:string[] };
export const leads: Lead[] = [
 {id:"marina-costa",name:"Marina Costa",company:"Lumina Arquitetura",initials:"MC",source:"Instagram",owner:"Rafael Lima",stage:"Negociação",value:28500,probability:80,temperature:"Quente",last:"Hoje, 14:32",next:"Enviar contrato",email:"marina@lumina.com.br",phone:"(11) 98744-2810",tags:["Enterprise","Inbound"]},
 {id:"andre-ferreira",name:"André Ferreira",company:"Nexo Logística",initials:"AF",source:"WhatsApp",owner:"Camila Souza",stage:"Proposta",value:17800,probability:65,temperature:"Quente",last:"Hoje, 11:05",next:"Follow-up amanhã",email:"andre@nexolog.com.br",phone:"(21) 99812-0403",tags:["Logística"]},
 {id:"bianca-moura",name:"Bianca Moura",company:"Clínica Vivaz",initials:"BM",source:"Indicação",owner:"Rafael Lima",stage:"Qualificado",value:12400,probability:45,temperature:"Morno",last:"Ontem, 17:42",next:"Reunião 30/09",email:"bianca@clinicavivaz.com.br",phone:"(31) 99101-7832",tags:["Saúde","Indicação"]},
 {id:"lucas-mendes",name:"Lucas Mendes",company:"Vértice Solar",initials:"LM",source:"Google Ads",owner:"João Pedro",stage:"Novo Lead",value:8200,probability:20,temperature:"Morno",last:"Há 16 min",next:"Primeiro contato",email:"lucas@verticesolar.com.br",phone:"(19) 98821-4430",tags:["Inbound"]},
 {id:"renata-alves",name:"Renata Alves",company:"Onda Educação",initials:"RA",source:"LinkedIn",owner:"Camila Souza",stage:"Contato realizado",value:9600,probability:30,temperature:"Frio",last:"Há 2 dias",next:"Enviar material",email:"renata@ondaedu.com.br",phone:"(41) 99218-3601",tags:["Educação"]},
 {id:"paulo-rocha",name:"Paulo Rocha",company:"Atlas Contábil",initials:"PR",source:"WhatsApp",owner:"Rafael Lima",stage:"Ganho",value:22400,probability:100,temperature:"Quente",last:"Ontem, 09:20",next:"Onboarding",email:"paulo@atlascontabil.com.br",phone:"(51) 99720-9002",tags:["Cliente"]},
 {id:"carla-dias",name:"Carla Dias",company:"Essenza Foods",initials:"CD",source:"Evento",owner:"João Pedro",stage:"Negociação",value:34600,probability:75,temperature:"Quente",last:"Há 3 dias",next:"Revisar proposta",email:"carla@essenzafoods.com.br",phone:"(11) 98210-1174",tags:["Enterprise"]},
];
export const money = (v:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v);
export const chartData=[{name:"Seg",leads:18,vendas:6},{name:"Ter",leads:25,vendas:9},{name:"Qua",leads:21,vendas:8},{name:"Qui",leads:34,vendas:14},{name:"Sex",leads:29,vendas:12},{name:"Sáb",leads:15,vendas:5},{name:"Dom",leads:12,vendas:4}];
export const activities=[
 {type:"lead",title:"Novo lead recebido pelo WhatsApp",detail:"Lucas Mendes · Vértice Solar",time:"16 min"},
 {type:"proposal",title:"Proposta enviada",detail:"André Ferreira · R$ 17.800",time:"1h"},
 {type:"ai",title:"IA qualificou novo contato",detail:"Bianca Moura atingiu score 82",time:"2h"},
 {type:"win",title:"Venda fechada",detail:"Atlas Contábil · R$ 22.400",time:"Ontem"},
];
export const tasks=[
 {title:"Enviar contrato revisado",person:"Marina Costa",time:"09:30",type:"Proposta",late:false},
 {title:"Follow-up da proposta",person:"André Ferreira",time:"10:15",type:"WhatsApp",late:false},
 {title:"Ligação de qualificação",person:"Lucas Mendes",time:"11:00",type:"Ligação",late:false},
 {title:"Confirmar reunião de diagnóstico",person:"Bianca Moura",time:"14:30",type:"Reunião",late:false},
 {title:"Retornar sobre integração",person:"Renata Alves",time:"Ontem",type:"E-mail",late:true},
];
