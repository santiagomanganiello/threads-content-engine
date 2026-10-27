import { GeneratedContentDraft, GeneratedContentDraftSchema, PostCategory } from '@threads-engine/contracts';
import { ContentGenerator, GenerateDraftParams, GenerationResult } from './ai-generator.interface.js';

interface TemplatePool {
  hook: string;
  text: string;
  question: string;
  factualClaims: string[];
  needsFactCheck: boolean;
}

const TEMPLATES_BY_CATEGORY: Record<PostCategory, TemplatePool[]> = {
  BASS_HISTORY: [
    {
      hook: 'El bajo que cambió la historia del soul para siempre.',
      text: 'James Jamerson grabó casi todos los éxitos de Motown con un solo bajo: un Fender Precision del 62 apodado "The Funk Machine", con cuerdas flatwound La Bella que jamás limpió ni cambió en años. Su técnica con un solo dedo ("The Hook") construyó la base del pop moderno.',
      question: '¿Alguna vez probaste cuerdas flatwound con sordina de espuma?',
      factualClaims: [
        'James Jamerson usó un Fender Precision 1962 llamado "The Funk Machine"',
        'Usaba cuerdas flatwound marca La Bella sin cambiarlas por años',
        'Grabó la mayoría de hits de Motown tocando con el dedo índice ("The Hook")',
      ],
      needsFactCheck: true,
    },
    {
      hook: 'El bajo que desafió las reglas del prog rock.',
      text: 'En 1971, Chris Squire grabó "Roundabout" de Yes usando su mítico Rickenbacker 4001S de 1964 conectado en estéreo: la pastilla del puente a un Marshall saturado de guitarra y la del mástil a un ampli de bajo limpio. Ese brillo metálico definió el sonido progresivo.',
      question: '¿Sos de buscar sonido de bajo con distorsión o preferís graves puros?',
      factualClaims: [
        'Chris Squire usó un Rickenbacker 4001S de 1964 en Roundabout (1971)',
        'Ruteaba la señal en estéreo con un ampli de guitarra Marshall distorsionado',
      ],
      needsFactCheck: true,
    },
    {
      hook: 'El día que el funk se volvió agresivo y punzante.',
      text: 'Cuando Flea grabó "Blood Sugar Sex Magik" en 1991, usó un Wal Mach II y un Music Man StingRay. El preamplificador activo a 9V del StingRay le dio ese ataque seco y percusivo al slap que no se parecía a nada de la época.',
      question: '¿StingRay o Jazz Bass para slap? Abro debate.',
      factualClaims: [
        'Flea usó Wal Mach II y Music Man StingRay en Blood Sugar Sex Magik (1991)',
        'El circuito activo de Music Man fue pionero comercialmente en 1976',
      ],
      needsFactCheck: true,
    },
  ],
  COMMUNITY: [
    {
      hook: 'Bajista, si tuvieras que quedarte con uno solo por el resto de tu vida...',
      text: 'Dilema clásico de sala de ensayo: un Precision con flats gastadas para empastar en cualquier mezcla, o un Jazz Bass con ambos micrófonos al palo para cortar con brillo y medios. No podés elegir los dos.',
      question: '¿P-Bass o J-Bass? Dejá tu argumento abajo.',
      factualClaims: [],
      needsFactCheck: false,
    },
    {
      hook: 'La grieta silenciosa del bajo: ¿dedos, púa o pulgar?',
      text: 'Muchos puristas dicen que "el bajo se toca con los dedos", pero sin púa jamás hubiésemos tenido el ataque de Paul McCartney en Abbey Road o Carol Kaye en The Beach Boys. Cada ataque es un timbre distinto.',
      question: '¿Qué porcentaje de tu tiempo tocás con púa versus dedos?',
      factualClaims: [
        'Carol Kaye usaba púa dura de fieltro o plástico en las sesiones de The Wrecking Crew',
      ],
      needsFactCheck: false,
    },
    {
      hook: 'Confesión de bajista: ¿cuántos pedales realmente necesitás?',
      text: 'Típico: armás una pedalera con 8 pedales boutique, octavadores, modulaciones y fuzz... para después llegar al show y que el sonidista te enchufe directo a una caja directa pasiva sin prender el ampli.',
      question: '¿Llevás pedalera completa o sos del team afinador + DI directa?',
      factualClaims: [],
      needsFactCheck: false,
    },
  ],
  EDUCATION: [
    {
      hook: 'El tip de oro para limpiar los graves en cualquier sala.',
      text: 'La técnica de "floating thumb" (pulgar flotante) no es un capricho técnico: es el secreto para que las cuerdas graves al aire no resuenen por simpatía cuando tocás notas altas. Apoyá el costado del pulgar descansando sobre la 4ta y 5ta cuerda mientras bajás.',
      question: '¿Usás pulgar anclado en el micrófono o floating thumb?',
      factualClaims: [],
      needsFactCheck: false,
    },
    {
      hook: 'Por qué tu bajo suena gigante solo pero desaparece con la banda.',
      text: 'El error más común al ecualizar el bajo es recortar los medios y subir graves y agudos (la famosa curva en "V"). En tu casa suena bárbaro, pero con bombo y guitarras te comés todas las frecuencias de empaste. La presencia real vive entre los 400Hz y los 800Hz.',
      question: '¿En qué frecuencia solés darle boost a tus medios?',
      factualClaims: [
        'El rango de 400Hz a 800Hz concentra la inteligibilidad armónica del bajo en la mezcla',
      ],
      needsFactCheck: false,
    },
    {
      hook: 'Cómo cuidar la afinación sin gastar en clavijas nuevas.',
      text: 'Cuando pongas cuerdas nuevas, estiralas manualmente y afiná siempre "desde abajo hacia arriba" (en subida de tono). Si te pasás, bajá medio tono y volvé a subir. Eso traba el engranaje del clavijero contra la tensión de la cuerda y previene desafinaciones.',
      question: '¿Cada cuánto cambiás las cuerdas de tu bajo principal?',
      factualClaims: [],
      needsFactCheck: false,
    },
  ],
  CULTURE: [
    {
      hook: 'La línea de bajo más sampleada de la historia.',
      text: 'Bernard Edwards compuso la línea de "Good Times" de Chic en 1979 con un Music Man StingRay. Pocos meses después, Sugarhill Gang la usó para "Rapper’s Delight" y Queen se inspiró en ella para "Another One Bites the Dust". Una sola línea parió dos géneros.',
      question: '¿Cuál es para vos el riff de bajo más contagioso de la música?',
      factualClaims: [
        'Good Times fue lanzada por Chic en 1979',
        'Sugarhill Gang sampleó/regrabó la base en Rapper’s Delight en 1979',
        'John Deacon compuso Another One Bites the Dust inspirado por Bernard Edwards',
      ],
      needsFactCheck: true,
    },
  ],
  HUMOR: [
    {
      hook: 'Cosas que solo le pasan a un bajista en una prueba de sonido.',
      text: 'El baterista prueba 45 minutos plato por plato. El guitarrista afina 8 veces y busca el reverb perfecto. El sonidista te mira a vos: "Tocá una nota. Listo, ya está el bajo". Y encima salís por la mezcla sonando impecable.',
      question: '¿Te pasó alguna vez? Dejá tu anécdota de prueba de sonido.',
      factualClaims: [],
      needsFactCheck: false,
    },
  ],
  GROWTH: [
    {
      hook: 'Lo que nadie te dice para sonar profesional en el bajo sin gastar un centavo.',
      text: '1. Muteá siempre las cuerdas que no tocás con la palma o el pulgar.\n2. No recortes medios en tu ampli: la presencia vive en 500-800Hz.\n3. Tocá a tempo antes de meter notas rápidas.\n\nTodos los días comparto tips prácticos y secretos de audio para bajistas. Seguime en @polagruv para potenciar tu sonido y guardá este post para tu próximo ensayo.',
      question: '¿Cuál de estos 3 puntos es el que más te cuesta aplicar en vivo?',
      factualClaims: [],
      needsFactCheck: false,
    },
    {
      hook: '3 errores silenciosos que arruinan tu sonido en el bajo.',
      text: '1. Apretar el mástil con fuerza excesiva (te fatiga y desafina la nota).\n2. Dejar las cuerdas al aire vibrando por simpatía.\n3. Creer que más graves significa más presencia.\n\nSi querés llevar tu nivel en las cuatro cuerdas al siguiente escalón, dale a "Seguir" a @polagruv. Subo contenido diario de técnica, groove y audio real sin vueltas.',
      question: '¿Cuántos años llevás tocando el bajo?',
      factualClaims: [],
      needsFactCheck: false,
    },
    {
      hook: 'Guardá esta guía rápida de ecualización para que tu bajo corte en cualquier mezcla.',
      text: '• 40-80Hz: Sub-graves (cuidado con tapar el bombo).\n• 200-250Hz: Zona de cartón (recortá un poco si suena bola).\n• 500-800Hz: La definición real de las notas (el secreto de empaste).\n• 2kHz+: Brillo y ataque de dedos o púa.\n\nGuardá este post para tu próxima prueba de sonido y seguime en @polagruv para más secretos de la cocina del bajo.',
      question: '¿Solés ecualizar plano o ya tenés tu curva favorita?',
      factualClaims: [],
      needsFactCheck: false,
    },
  ],
};

export class MockAiGenerator implements ContentGenerator {
  private promptVersion = 'v1.0-editorial-bass';

  async generateDraft(params: GenerateDraftParams): Promise<GenerationResult> {
    const pool = TEMPLATES_BY_CATEGORY[params.category] || TEMPLATES_BY_CATEGORY.BASS_HISTORY;
    // Pick one template randomly or cyclically
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    const promptText = `Generar un borrador para Threads en la sección ${params.sectionName || params.category}. Tono rioplatense natural para bajistas. Máximo 500 caracteres.`;

    const draft: GeneratedContentDraft = {
      category: params.category,
      text: chosen.text,
      hook: chosen.hook,
      question: chosen.question,
      factualClaims: chosen.factualClaims,
      needsFactCheck: chosen.needsFactCheck,
    };

    // Validar con zod
    const validated = GeneratedContentDraftSchema.parse(draft);

    return {
      draft: validated,
      model: 'mock-bass-generator-v1',
      promptVersion: this.promptVersion,
      promptText,
      rawResponse: JSON.stringify(validated),
      tokensPrompt: 120,
      tokensCompletion: 85,
    };
  }
}
