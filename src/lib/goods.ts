
export class Good {
    public readonly startValues: Record<(typeof Properties)[number], number>;
    public readonly name: string;

    /**
     *
     */
    constructor(
        name: string,
        startValues: Partial<Record<(typeof Properties)[number], number>> = {}
    ) {
        this.startValues = {
            availability: 1.0,
            cost: 1.0,
            time: 0,
            preservability: Infinity,
            ...startValues
        };
        this.name = name;
    }
}

export const goods = [
    {
        Name: 'Magische Elixier',
        Preis: 10.0,
        Haltbarkeit: 30
    },
    {
        Name: 'Drachenzahn-Amulett',
        Preis: 25.0,
        Haltbarkeit: null
    },
    {
        Name: 'Gnomische Schraubenschlüssel',
        Preis: 5.0,
        Haltbarkeit: 90
    },
    {
        Name: 'Elfenbrot',
        Preis: 2.0,
        Haltbarkeit: 7
    },
    {
        Name: 'Zwergenbier',
        Preis: 3.0,
        Haltbarkeit: 60
    },
    {
        Name: 'Phönixfeder',
        Preis: 50.0,
        Haltbarkeit: null
    },
    {
        Name: 'Einhornstaub',
        Preis: 100.0,
        Haltbarkeit: 365
    },
    {
        Name: 'Koboldtränke',
        Preis: 1.0,
        Haltbarkeit: 14
    },
    {
        Name: 'Trollhaut-Rüstung',
        Preis: 75.0,
        Haltbarkeit: null
    },
    {
        Name: 'Phiole mit Feenlicht',
        Preis: 20.0,
        Haltbarkeit: 180
    },
    {
        Name: 'Silberschwert',
        Preis: 15.0,
        Haltbarkeit: null
    },
    {
        Name: 'Drachenei',
        Preis: 100.0,
        Haltbarkeit: 120
    },
    {
        Name: 'Elixier der Unsichtbarkeit',
        Preis: 30.0,
        Haltbarkeit: 45
    },
    {
        Name: 'Goblinschleuder',
        Preis: 8.0,
        Haltbarkeit: 60
    },
    {
        Name: 'Vampirumhang',
        Preis: 40.0,
        Haltbarkeit: null
    },
    {
        Name: 'Feenstaubtrank',
        Preis: 5.0,
        Haltbarkeit: 30
    },
    {
        Name: 'Zauberstab der Elemente',
        Preis: 60.0,
        Haltbarkeit: null
    },
    {
        Name: 'Kristallkugel der Vorhersage',
        Preis: 75.0,
        Haltbarkeit: null
    },
    {
        Name: 'Greifgefiederpfeil',
        Preis: 3.0,
        Haltbarkeit: 45
    },
    {
        Name: 'Minotaurus-Hornhelm',
        Preis: 50.0,
        Haltbarkeit: null
    },
    {
        Name: 'Sphinxrätselrolle',
        Preis: 10.0,
        Haltbarkeit: 90
    },
    {
        Name: 'Königliche Robe',
        Preis: 70.0,
        Haltbarkeit: null
    },
    {
        Name: 'Giftpilztrank',
        Preis: 7.0,
        Haltbarkeit: 30
    },
    {
        Name: 'Einhornhufschuhe',
        Preis: 25.0,
        Haltbarkeit: 60
    },
    {
        Name: 'Werwolfpelzumhang',
        Preis: 45.0,
        Haltbarkeit: null
    },
    {
        Name: 'Orkkeule',
        Preis: 12.0,
        Haltbarkeit: 45
    },
    {
        Name: 'Nebelzaubertrank',
        Preis: 8.0,
        Haltbarkeit: 30
    },
    {
        Name: 'Koboldohrringe',
        Preis: 4.0,
        Haltbarkeit: 180
    },
    {
        Name: 'Diamantbesetzter Dolch',
        Preis: 150.0,
        Haltbarkeit: null
    },
    {
        Name: 'Phönixflügelfächer',
        Preis: 35.0,
        Haltbarkeit: null
    }
].map((x) => new Good(x.Name, { cost: x.Preis, preservability: x.Haltbarkeit ?? Infinity }));

export const Properties = ['availability', 'cost', 'time', 'preservability'] as const;

