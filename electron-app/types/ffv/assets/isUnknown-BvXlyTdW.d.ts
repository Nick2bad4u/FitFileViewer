declare namespace e {
    let ENUM: number;
    let SINT8: number;
    let UINT8: number;
    let SINT16: number;
    let UINT16: number;
    let SINT32: number;
    let UINT32: number;
    let STRING: number;
    let FLOAT32: number;
    let FLOAT64: number;
    let UINT8Z: number;
    let UINT16Z: number;
    let UINT32Z: number;
    let BYTE: number;
    let SINT64: number;
    let UINT64: number;
    let UINT64Z: number;
}
declare const h: {
    250: {
        fieldName: string;
        label: string;
        fieldType: string;
    };
    253: {
        fieldName: string;
        label: string;
        fieldType: string;
        units: string;
    };
    254: {
        fieldName: string;
        label: string;
        fieldType: string;
    };
};
declare const p: 4;
declare namespace s {
    import _enum = e.ENUM;
    export { _enum as enum };
    import sint8 = e.SINT8;
    export { sint8 };
    import uint8 = e.UINT8;
    export { uint8 };
    import sint16 = e.SINT16;
    export { sint16 };
    import uint16 = e.UINT16;
    export { uint16 };
    import sint32 = e.SINT32;
    export { sint32 };
    import uint32 = e.UINT32;
    export { uint32 };
    import string = e.STRING;
    export { string };
    import float32 = e.FLOAT32;
    export { float32 };
    import float64 = e.FLOAT64;
    export { float64 };
    import uint8z = e.UINT8Z;
    export { uint8z };
    import uint16z = e.UINT16Z;
    export { uint16z };
    import uint32z = e.UINT32Z;
    export { uint32z };
    import byte = e.BYTE;
    export { byte };
    import sint64 = e.SINT64;
    export { sint64 };
    import uint64 = e.UINT64;
    export { uint64 };
    import uint64z = e.UINT64Z;
    export { uint64z };
}
declare const N: boolean;
declare const n: string[];
declare const y: string[];
declare const g: 86400;
declare const f: 253;
declare function w(i: any, t?: number): string;
declare function T(i: any, t?: number): string;
declare function z(i: any): any;
declare const l: {
    0: {
        size: number;
        type: number;
        invalid: number;
    };
    1: {
        size: number;
        type: number;
        invalid: number;
    };
    2: {
        size: number;
        type: number;
        invalid: number;
    };
    131: {
        size: number;
        type: number;
        invalid: number;
    };
    132: {
        size: number;
        type: number;
        invalid: number;
    };
    133: {
        size: number;
        type: number;
        invalid: number;
    };
    134: {
        size: number;
        type: number;
        invalid: number;
    };
    7: {
        size: number;
        type: number;
        invalid: number;
    };
    136: {
        size: number;
        type: number;
        invalid: number;
    };
    137: {
        size: number;
        type: number;
        invalid: number;
    };
    10: {
        size: number;
        type: number;
        invalid: number;
    };
    139: {
        size: number;
        type: number;
        invalid: number;
    };
    140: {
        size: number;
        type: number;
        invalid: number;
    };
    13: {
        size: number;
        type: number;
        invalid: number;
    };
    142: {
        size: number;
        type: number;
        invalid: number;
    };
    143: {
        size: number;
        type: number;
        invalid: number;
    };
    144: {
        size: number;
        type: number;
        invalid: number;
    };
};
declare const b: string[];
declare namespace u {
    export { e as BaseType };
    export { l as BaseTypeDefinitions };
    export { n as NumericFieldTypes };
    export { s as FieldTypeToBaseType };
}
declare const o: 2;
declare function v(i: any): any;
declare function r(i: any): boolean;
declare const c: 631065600;
declare function k(i: any): any;
declare namespace m {
    namespace types {
        export let file: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            14: string;
            15: string;
            20: string;
            28: string;
            29: string;
            32: string;
            33: string;
            34: string;
            35: string;
            37: string;
            38: string;
            40: string;
            44: string;
            49: string;
            56: string;
            65: string;
            68: string;
            72: string;
            74: string;
            77: string;
            '0xF7': string;
            '0xFE': string;
        };
        export let mesg_num: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            37: string;
            38: string;
            39: string;
            49: string;
            51: string;
            53: string;
            55: string;
            70: string;
            71: string;
            72: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            89: string;
            101: string;
            103: string;
            104: string;
            105: string;
            106: string;
            113: string;
            114: string;
            127: string;
            128: string;
            129: string;
            131: string;
            132: string;
            140: string;
            141: string;
            142: string;
            143: string;
            144: string;
            145: string;
            147: string;
            148: string;
            149: string;
            150: string;
            151: string;
            152: string;
            158: string;
            159: string;
            160: string;
            161: string;
            162: string;
            164: string;
            165: string;
            167: string;
            169: string;
            170: string;
            173: string;
            174: string;
            177: string;
            178: string;
            184: string;
            185: string;
            186: string;
            187: string;
            188: string;
            190: string;
            191: string;
            192: string;
            193: string;
            194: string;
            200: string;
            201: string;
            202: string;
            206: string;
            207: string;
            208: string;
            209: string;
            210: string;
            211: string;
            216: string;
            225: string;
            227: string;
            229: string;
            233: string;
            243: string;
            258: string;
            259: string;
            262: string;
            264: string;
            268: string;
            269: string;
            275: string;
            285: string;
            288: string;
            289: string;
            290: string;
            297: string;
            302: string;
            304: string;
            305: string;
            306: string;
            307: string;
            308: string;
            309: string;
            310: string;
            311: string;
            312: string;
            313: string;
            314: string;
            315: string;
            317: string;
            319: string;
            321: string;
            323: string;
            324: string;
            325: string;
            326: string;
            327: string;
            346: string;
            358: string;
            370: string;
            371: string;
            372: string;
            375: string;
            376: string;
            379: string;
            387: string;
            388: string;
            389: string;
            393: string;
            394: string;
            398: string;
            409: string;
            428: string;
            '0xFF00': string;
            '0xFFFE': string;
        };
        export let checksum: {
            0: string;
            1: string;
        };
        export let file_flags: {
            bitFlags: boolean;
            '0x02': string;
            '0x04': string;
            '0x08': string;
        };
        export let mesg_count: {
            0: string;
            1: string;
            2: string;
        };
        export let date_time: {
            '0x10000000': string;
        };
        export let local_date_time: {
            '0x10000000': string;
        };
        export let message_index: {
            '0x8000': string;
            '0x7000': string;
            '0x0FFF': string;
        };
        export let device_index: {
            0: string;
        };
        export let gender: {
            0: string;
            1: string;
        };
        export let language: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            254: string;
        };
        export let language_bits_0: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let language_bits_1: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let language_bits_2: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let language_bits_3: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let language_bits_4: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
        };
        export let time_zone: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
            85: string;
            86: string;
            87: string;
            88: string;
            89: string;
            90: string;
            91: string;
            92: string;
            93: string;
            94: string;
            95: string;
            96: string;
            97: string;
            98: string;
            99: string;
            100: string;
            101: string;
            102: string;
            103: string;
            253: string;
            254: string;
        };
        export let display_measure: {
            0: string;
            1: string;
            2: string;
        };
        export let display_heart: {
            0: string;
            1: string;
            2: string;
        };
        export let display_power: {
            0: string;
            1: string;
        };
        export let display_position: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
        };
        let _switch: {
            0: string;
            1: string;
            2: string;
        };
        export { _switch as switch };
        export let sport: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            53: string;
            62: string;
            64: string;
            65: string;
            66: string;
            67: string;
            69: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            80: string;
            82: string;
            83: string;
            84: string;
            254: string;
        };
        export let sport_bits_0: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let sport_bits_1: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let sport_bits_2: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let sport_bits_3: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let sport_bits_4: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let sport_bits_5: {
            bitFlags: boolean;
            '0x01': string;
            '0x02': string;
            '0x04': string;
            '0x08': string;
            '0x10': string;
            '0x20': string;
            '0x40': string;
            '0x80': string;
        };
        export let sport_bits_6: {
            bitFlags: boolean;
            '0x01': string;
        };
        export let sub_sport: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            62: string;
            65: string;
            67: string;
            68: string;
            69: string;
            70: string;
            73: string;
            74: string;
            75: string;
            84: string;
            85: string;
            86: string;
            87: string;
            88: string;
            94: string;
            95: string;
            96: string;
            97: string;
            110: string;
            111: string;
            112: string;
            113: string;
            114: string;
            115: string;
            116: string;
            117: string;
            118: string;
            119: string;
            254: string;
        };
        export let sport_event: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
        };
        export let activity: {
            0: string;
            1: string;
        };
        export let intensity: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
        };
        export let session_trigger: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let autolap_trigger: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            13: string;
        };
        export let lap_trigger: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
        };
        export let time_mode: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        };
        export let backlight_mode: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
        };
        export let date_mode: {
            0: string;
            1: string;
        };
        export let backlight_timeout: {
            0: string;
        };
        export let event: {
            0: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            32: string;
            33: string;
            36: string;
            39: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            54: string;
            56: string;
            57: string;
            71: string;
            72: string;
            73: string;
            75: string;
            76: string;
            81: string;
            82: string;
        };
        export let event_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
        };
        export let timer_trigger: {
            0: string;
            1: string;
            2: string;
        };
        export let fitness_equipment_state: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let tone: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let autoscroll: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let activity_class: {
            100: string;
            '0x7F': string;
            '0x80': string;
        };
        export let hr_zone_calc: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let pwr_zone_calc: {
            0: string;
            1: string;
        };
        export let wkt_step_duration: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            31: string;
        };
        export let wkt_step_target: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
        };
        export let goal: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
        };
        export let goal_recurrence: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        };
        export let goal_source: {
            0: string;
            1: string;
            2: string;
        };
        export let schedule: {
            0: string;
            1: string;
        };
        export let course_point: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
        };
        export let manufacturer: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
            85: string;
            86: string;
            87: string;
            88: string;
            89: string;
            90: string;
            91: string;
            92: string;
            93: string;
            94: string;
            95: string;
            96: string;
            97: string;
            98: string;
            99: string;
            100: string;
            101: string;
            102: string;
            103: string;
            104: string;
            105: string;
            106: string;
            107: string;
            108: string;
            109: string;
            110: string;
            111: string;
            112: string;
            113: string;
            114: string;
            115: string;
            116: string;
            117: string;
            118: string;
            119: string;
            120: string;
            121: string;
            122: string;
            123: string;
            124: string;
            125: string;
            126: string;
            127: string;
            128: string;
            129: string;
            130: string;
            131: string;
            132: string;
            133: string;
            134: string;
            135: string;
            136: string;
            137: string;
            138: string;
            139: string;
            140: string;
            141: string;
            142: string;
            143: string;
            144: string;
            145: string;
            146: string;
            147: string;
            148: string;
            149: string;
            150: string;
            151: string;
            152: string;
            255: string;
            257: string;
            258: string;
            259: string;
            260: string;
            261: string;
            262: string;
            263: string;
            264: string;
            265: string;
            266: string;
            267: string;
            268: string;
            269: string;
            270: string;
            271: string;
            272: string;
            273: string;
            274: string;
            275: string;
            276: string;
            277: string;
            278: string;
            279: string;
            280: string;
            281: string;
            282: string;
            283: string;
            284: string;
            285: string;
            286: string;
            287: string;
            288: string;
            289: string;
            290: string;
            291: string;
            292: string;
            293: string;
            294: string;
            295: string;
            296: string;
            297: string;
            298: string;
            299: string;
            300: string;
            301: string;
            302: string;
            303: string;
            304: string;
            305: string;
            306: string;
            307: string;
            308: string;
            309: string;
            310: string;
            311: string;
            312: string;
            313: string;
            314: string;
            315: string;
            316: string;
            317: string;
            318: string;
            319: string;
            320: string;
            321: string;
            322: string;
            323: string;
            324: string;
            325: string;
            326: string;
            327: string;
            328: string;
            329: string;
            330: string;
            331: string;
            332: string;
            5759: string;
        };
        export let garmin_product: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            22: string;
            255: string;
            473: string;
            474: string;
            475: string;
            494: string;
            717: string;
            782: string;
            987: string;
            988: string;
            1011: string;
            1018: string;
            1036: string;
            1124: string;
            1169: string;
            1199: string;
            1213: string;
            1253: string;
            1274: string;
            1325: string;
            1328: string;
            1333: string;
            1334: string;
            1341: string;
            1345: string;
            1360: string;
            1380: string;
            1381: string;
            1386: string;
            1387: string;
            1405: string;
            1410: string;
            1422: string;
            1436: string;
            1446: string;
            1461: string;
            1482: string;
            1497: string;
            1499: string;
            1537: string;
            1551: string;
            1555: string;
            1561: string;
            1567: string;
            1570: string;
            1600: string;
            1623: string;
            1632: string;
            1664: string;
            1688: string;
            1721: string;
            1735: string;
            1736: string;
            1742: string;
            1743: string;
            1752: string;
            1765: string;
            1821: string;
            1822: string;
            1823: string;
            1836: string;
            1837: string;
            1853: string;
            1885: string;
            1903: string;
            1907: string;
            1918: string;
            1928: string;
            1929: string;
            1930: string;
            1931: string;
            1936: string;
            1956: string;
            1967: string;
            1988: string;
            2050: string;
            2052: string;
            2053: string;
            2061: string;
            2067: string;
            2070: string;
            2072: string;
            2073: string;
            2079: string;
            2100: string;
            2130: string;
            2131: string;
            2132: string;
            2134: string;
            2135: string;
            2140: string;
            2147: string;
            2148: string;
            2150: string;
            2153: string;
            2156: string;
            2157: string;
            2158: string;
            2160: string;
            2161: string;
            2162: string;
            2172: string;
            2173: string;
            2174: string;
            2175: string;
            2187: string;
            2188: string;
            2189: string;
            2192: string;
            2193: string;
            2204: string;
            2219: string;
            2225: string;
            2226: string;
            2238: string;
            2260: string;
            2261: string;
            2262: string;
            2266: string;
            2271: string;
            2274: string;
            2276: string;
            2288: string;
            2289: string;
            2290: string;
            2292: string;
            2293: string;
            2294: string;
            2310: string;
            2311: string;
            2313: string;
            2327: string;
            2332: string;
            2337: string;
            2347: string;
            2348: string;
            2361: string;
            2362: string;
            2368: string;
            2379: string;
            2396: string;
            2397: string;
            2398: string;
            2406: string;
            2407: string;
            2408: string;
            2413: string;
            2417: string;
            2429: string;
            2431: string;
            2432: string;
            2441: string;
            2444: string;
            2457: string;
            2473: string;
            2474: string;
            2475: string;
            2476: string;
            2477: string;
            2496: string;
            2497: string;
            2503: string;
            2512: string;
            2530: string;
            2531: string;
            2533: string;
            2534: string;
            2544: string;
            2547: string;
            2567: string;
            2593: string;
            2599: string;
            2600: string;
            2604: string;
            2606: string;
            2622: string;
            2623: string;
            2628: string;
            2629: string;
            2630: string;
            2650: string;
            2656: string;
            2667: string;
            2668: string;
            2675: string;
            2687: string;
            2691: string;
            2697: string;
            2700: string;
            2713: string;
            2727: string;
            2733: string;
            2769: string;
            2772: string;
            2787: string;
            2796: string;
            2797: string;
            2798: string;
            2806: string;
            2814: string;
            2819: string;
            2831: string;
            2832: string;
            2833: string;
            2859: string;
            2878: string;
            2886: string;
            2888: string;
            2891: string;
            2900: string;
            2909: string;
            2924: string;
            2927: string;
            2945: string;
            2962: string;
            2977: string;
            2988: string;
            3003: string;
            3004: string;
            3011: string;
            3028: string;
            3049: string;
            3066: string;
            3085: string;
            3092: string;
            3095: string;
            3110: string;
            3111: string;
            3112: string;
            3113: string;
            3121: string;
            3122: string;
            3126: string;
            3134: string;
            3135: string;
            3142: string;
            3143: string;
            3144: string;
            3145: string;
            3163: string;
            3192: string;
            3193: string;
            3218: string;
            3224: string;
            3225: string;
            3226: string;
            3246: string;
            3247: string;
            3248: string;
            3249: string;
            3250: string;
            3251: string;
            3258: string;
            3284: string;
            3287: string;
            3288: string;
            3289: string;
            3290: string;
            3291: string;
            3299: string;
            3300: string;
            3308: string;
            3314: string;
            3321: string;
            3349: string;
            3350: string;
            3378: string;
            3387: string;
            3388: string;
            3389: string;
            3405: string;
            3420: string;
            3421: string;
            3422: string;
            3441: string;
            3446: string;
            3448: string;
            3449: string;
            3450: string;
            3451: string;
            3461: string;
            3466: string;
            3469: string;
            3473: string;
            3498: string;
            3499: string;
            3500: string;
            3501: string;
            3512: string;
            3513: string;
            3514: string;
            3515: string;
            3516: string;
            3535: string;
            3536: string;
            3537: string;
            3538: string;
            3542: string;
            3558: string;
            3570: string;
            3578: string;
            3589: string;
            3600: string;
            3615: string;
            3624: string;
            3638: string;
            3639: string;
            3648: string;
            3652: string;
            3702: string;
            3703: string;
            3704: string;
            3737: string;
            3739: string;
            3740: string;
            3794: string;
            3808: string;
            3809: string;
            3812: string;
            3813: string;
            3823: string;
            3837: string;
            3843: string;
            3850: string;
            3851: string;
            3865: string;
            3869: string;
            3872: string;
            3888: string;
            3905: string;
            3906: string;
            3907: string;
            3908: string;
            3909: string;
            3910: string;
            3930: string;
            3934: string;
            3943: string;
            3944: string;
            3949: string;
            3950: string;
            3978: string;
            3982: string;
            3983: string;
            3986: string;
            3990: string;
            3991: string;
            3992: string;
            3993: string;
            4002: string;
            4005: string;
            4017: string;
            4024: string;
            4033: string;
            4061: string;
            4062: string;
            4063: string;
            4071: string;
            4105: string;
            4115: string;
            4116: string;
            4124: string;
            4125: string;
            4130: string;
            4132: string;
            4135: string;
            4155: string;
            4169: string;
            4222: string;
            4223: string;
            4233: string;
            4257: string;
            4258: string;
            4260: string;
            4261: string;
            4265: string;
            4266: string;
            4267: string;
            4268: string;
            4269: string;
            4270: string;
            4271: string;
            4272: string;
            4273: string;
            4274: string;
            4275: string;
            4276: string;
            4305: string;
            4312: string;
            4313: string;
            4314: string;
            4315: string;
            4341: string;
            4374: string;
            4375: string;
            4376: string;
            4380: string;
            4394: string;
            4426: string;
            4432: string;
            4433: string;
            4440: string;
            4442: string;
            4446: string;
            4472: string;
            4477: string;
            4532: string;
            4533: string;
            4534: string;
            4536: string;
            4556: string;
            4575: string;
            4666: string;
            10007: string;
            10014: string;
            20119: string;
            20533: string;
            20534: string;
            20565: string;
            30045: string;
            30046: string;
            30047: string;
            65531: string;
            65532: string;
            65534: string;
            ' 3927': string;
            ' 4001': string;
        };
        export let antplus_device_type: {
            1: string;
            11: string;
            12: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            25: string;
            26: string;
            27: string;
            31: string;
            34: string;
            35: string;
            36: string;
            38: string;
            40: string;
            46: string;
            119: string;
            120: string;
            121: string;
            122: string;
            123: string;
            124: string;
        };
        export let ant_network: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let workout_capabilities: {
            bitFlags: boolean;
            '0x00000001': string;
            '0x00000002': string;
            '0x00000004': string;
            '0x00000008': string;
            '0x00000010': string;
            '0x00000020': string;
            '0x00000080': string;
            '0x00000100': string;
            '0x00000200': string;
            '0x00000400': string;
            '0x00000800': string;
            '0x00001000': string;
            '0x00002000': string;
            '0x00004000': string;
        };
        export let battery_status: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
        };
        export let hr_type: {
            0: string;
            1: string;
        };
        export let course_capabilities: {
            bitFlags: boolean;
            '0x00000001': string;
            '0x00000002': string;
            '0x00000004': string;
            '0x00000008': string;
            '0x00000010': string;
            '0x00000020': string;
            '0x00000040': string;
            '0x00000080': string;
            '0x00000100': string;
            '0x00000200': string;
            '0x00000400': string;
            '0x00001000': string;
        };
        export let weight: {
            '0xFFFE': string;
        };
        export let workout_hr: {
            100: string;
        };
        export let workout_power: {
            1000: string;
        };
        export let bp_status: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let user_local_id: {
            bitFlags: boolean;
            '0x0000': string;
            '0x000F': string;
            '0x0010': string;
            '0x00FF': string;
            '0x0100': string;
            '0xFFFE': string;
        };
        export let swim_stroke: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
        };
        export let activity_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            8: string;
            254: string;
        };
        export let activity_subtype: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            254: string;
        };
        export let activity_level: {
            0: string;
            1: string;
            2: string;
        };
        export let side: {
            0: string;
            1: string;
        };
        export let left_right_balance: {
            '0x7F': string;
            '0x80': string;
        };
        export let left_right_balance_100: {
            '0x3FFF': string;
            '0x8000': string;
        };
        export let length_type: {
            0: string;
            1: string;
        };
        export let day_of_week: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
        };
        export let connectivity_capabilities: {
            bitFlags: boolean;
            '0x00000001': string;
            '0x00000002': string;
            '0x00000004': string;
            '0x00000008': string;
            '0x00000010': string;
            '0x00000020': string;
            '0x00000040': string;
            '0x00000080': string;
            '0x00000100': string;
            '0x00000200': string;
            '0x00000400': string;
            '0x00000800': string;
            '0x00001000': string;
            '0x00002000': string;
            '0x00004000': string;
            '0x00008000': string;
            '0x00010000': string;
            '0x00020000': string;
            '0x00040000': string;
            '0x00080000': string;
            '0x00100000': string;
            '0x00200000': string;
            '0x00400000': string;
            '0x00800000': string;
            '0x01000000': string;
            '0x02000000': string;
            '0x04000000': string;
            '0x08000000': string;
            '0x10000000': string;
            '0x20000000': string;
            '0x40000000': string;
            '0x80000000': string;
        };
        export let weather_report: {
            0: string;
            1: string;
            2: string;
        };
        export let weather_status: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
        };
        export let weather_severity: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let weather_severe_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
        };
        export let time_into_day: {};
        export let localtime_into_day: {};
        export let stroke_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        };
        export let body_location: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
        };
        export let segment_lap_status: {
            0: string;
            1: string;
        };
        export let segment_leaderboard_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
        };
        export let segment_delete_status: {
            0: string;
            1: string;
            2: string;
        };
        export let segment_selection_type: {
            0: string;
            1: string;
        };
        export let source_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        };
        export let local_device_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            10: string;
            12: string;
        };
        export let ble_device_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
        };
        export let ant_channel_id: {
            '0xF0000000': string;
            '0x0F000000': string;
            '0x00FF0000': string;
            '0x0000FFFF': string;
        };
        export let display_orientation: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let workout_equipment: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        };
        export let watchface_mode: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let digital_watchface_layout: {
            0: string;
            1: string;
            2: string;
        };
        export let analog_watchface_layout: {
            0: string;
            1: string;
            2: string;
        };
        export let rider_position_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let power_phase_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let camera_event_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            11: string;
            12: string;
            13: string;
            14: string;
        };
        export let sensor_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let bike_light_network_config_type: {
            0: string;
            4: string;
            5: string;
            6: string;
        };
        export let comm_timeout_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let camera_orientation_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let attitude_stage: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let attitude_validity: {
            bitFlags: boolean;
            '0x0001': string;
            '0x0002': string;
            '0x0004': string;
            '0x0008': string;
            '0x0010': string;
            '0x0020': string;
            '0x0040': string;
            '0x0080': string;
            '0x0100': string;
            '0x0200': string;
            '0x0400': string;
            '0x0800': string;
            '0x1000': string;
        };
        export let auto_sync_frequency: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let exd_layout: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
        };
        export let exd_display_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
        };
        export let exd_data_units: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
        };
        export let exd_qualifiers: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            242: string;
            243: string;
            244: string;
            245: string;
            246: string;
            247: string;
            248: string;
            249: string;
            250: string;
        };
        export let exd_descriptors: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
            85: string;
            86: string;
            87: string;
            88: string;
            89: string;
            90: string;
            91: string;
            92: string;
            93: string;
            94: string;
            95: string;
            96: string;
        };
        export let auto_activity_detect: {
            bitFlags: boolean;
            '0x00000000': string;
            '0x00000001': string;
            '0x00000002': string;
            '0x00000004': string;
            '0x00000008': string;
            '0x00000020': string;
            '0x00000400': string;
        };
        export let supported_exd_screen_layouts: {
            bitFlags: boolean;
            '0x00000001': string;
            '0x00000002': string;
            '0x00000004': string;
            '0x00000008': string;
            '0x00000010': string;
            '0x00000020': string;
            '0x00000040': string;
            '0x00000080': string;
        };
        export let fit_base_type: {
            0: string;
            1: string;
            2: string;
            7: string;
            10: string;
            13: string;
            131: string;
            132: string;
            133: string;
            134: string;
            136: string;
            137: string;
            139: string;
            140: string;
            142: string;
            143: string;
            144: string;
        };
        export let turn_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
        };
        export let bike_light_beam_angle_mode: {
            0: string;
            1: string;
        };
        export let fit_base_unit: {
            0: string;
            1: string;
            2: string;
        };
        export let set_type: {
            0: string;
            1: string;
        };
        export let max_met_category: {
            0: string;
            1: string;
        };
        export let exercise_category: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            35: string;
            36: string;
            37: string;
            65534: string;
        };
        export let bench_press_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
        };
        export let calf_raise_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
        };
        export let cardio_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
        };
        export let carry_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let chop_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
        };
        export let core_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
        };
        export let crunch_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
        };
        export let curl_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
        };
        export let deadlift_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
        };
        export let flye_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
        };
        export let hip_raise_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
        };
        export let hip_stability_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
        };
        export let hip_swing_exercise_name: {
            0: string;
            1: string;
            2: string;
        };
        export let hyperextension_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
        };
        export let lateral_raise_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
        };
        export let leg_curl_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
        };
        export let leg_raise_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
        };
        export let lunge_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
        };
        export let olympic_lift_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
        };
        export let plank_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
            85: string;
            86: string;
            87: string;
            88: string;
            89: string;
            90: string;
            91: string;
            92: string;
            93: string;
            94: string;
            95: string;
            96: string;
            97: string;
            98: string;
            99: string;
            100: string;
            101: string;
            102: string;
            103: string;
            104: string;
            105: string;
            106: string;
            107: string;
            108: string;
            109: string;
            110: string;
            111: string;
            112: string;
            113: string;
            114: string;
            115: string;
            116: string;
            117: string;
            118: string;
            119: string;
            120: string;
            121: string;
            122: string;
            123: string;
            124: string;
            125: string;
            126: string;
            127: string;
            128: string;
            129: string;
            130: string;
            131: string;
            132: string;
            133: string;
            134: string;
        };
        export let plyo_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
        };
        export let pull_up_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
        };
        export let push_up_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
        };
        export let row_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
        };
        export let shoulder_press_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
        };
        export let shoulder_stability_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
        };
        export let shrug_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
        };
        export let sit_up_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
        };
        export let squat_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
            85: string;
            86: string;
            87: string;
            88: string;
            89: string;
            90: string;
            91: string;
        };
        export let total_body_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
        };
        export let triceps_extension_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
        };
        export let warm_up_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
        };
        export let run_exercise_name: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let water_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let tissue_model_type: {
            0: string;
        };
        export let dive_gas_status: {
            0: string;
            1: string;
            2: string;
        };
        export let dive_alert: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
        };
        export let dive_alarm_type: {
            0: string;
            1: string;
            2: string;
        };
        export let dive_backlight_mode: {
            0: string;
            1: string;
        };
        export let sleep_level: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let spo2_measurement_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let ccr_setpoint_switch_mode: {
            0: string;
            1: string;
        };
        export let dive_gas_mode: {
            0: string;
            1: string;
        };
        export let projectile_type: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        };
        export let favero_product: {
            10: string;
            12: string;
        };
        export let split_type: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            17: string;
            18: string;
            21: string;
            22: string;
            23: string;
            28: string;
            29: string;
        };
        export let climb_pro_event: {
            0: string;
            1: string;
            2: string;
        };
        export let gas_consumption_rate_type: {
            0: string;
            1: string;
            2: string;
        };
        export let tap_sensitivity: {
            0: string;
            1: string;
            2: string;
        };
        export let radar_threat_level_type: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let max_met_speed_source: {
            0: string;
            1: string;
            2: string;
        };
        export let max_met_heart_rate_source: {
            0: string;
            1: string;
        };
        export let hrv_status: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
        export let no_fly_time_mode: {
            0: string;
            1: string;
        };
        export let alert_metric: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            7: string;
            8: string;
        };
        export let alert_zone: {
            0: string;
            1: string;
            101: string;
            102: string;
            103: string;
            104: string;
            105: string;
        };
        export let allow: {
            0: string;
            1: string;
        };
        export let auto_lap_mode: {
            0: string;
            1: string;
            2: string;
            6: string;
        };
        export let auto_pause_setting: {
            0: string;
            1: string;
            2: string;
        };
        export let auto_scroll_mode: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let avoidances: {
            bitFlags: boolean;
            '0x0001': string;
            '0x0002': string;
            '0x0004': string;
            '0x0008': string;
            '0x0010': string;
            '0x0020': string;
            '0x0040': string;
            '0x0080': string;
            '0x0100': string;
        };
        export let benefit: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
        };
        export let calculation_method: {
            0: string;
            1: string;
            3: string;
        };
        export let climb_detection: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
        };
        export let climb_pro_mode: {
            1: string;
            2: string;
        };
        export let climb_pro_terrain: {
            0: string;
            1: string;
            3: string;
        };
        export let connection_type: {
            0: string;
            1: string;
            2: string;
        };
        export let course_recalculation: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let courses: {
            0: string;
            1: string;
        };
        export let data_fields: {
            0: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            9: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            28: string;
            29: string;
            30: string;
            31: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            39: string;
            40: string;
            43: string;
            45: string;
            48: string;
            49: string;
            50: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            63: string;
            67: string;
            77: string;
            78: string;
            80: string;
            84: string;
            85: string;
            86: string;
            87: string;
            91: string;
            92: string;
            93: string;
            94: string;
            96: string;
            97: string;
            99: string;
            100: string;
            108: string;
            165: string;
            170: string;
            171: string;
            172: string;
            173: string;
            174: string;
            175: string;
            187: string;
            188: string;
            197: string;
            199: string;
            200: string;
            201: string;
            202: string;
            203: string;
            214: string;
            215: string;
            216: string;
            219: string;
            220: string;
            221: string;
            222: string;
            223: string;
            224: string;
            225: string;
            226: string;
            227: string;
            228: string;
            229: string;
            230: string;
            231: string;
            233: string;
            234: string;
            235: string;
            236: string;
            237: string;
            238: string;
            239: string;
            240: string;
            241: string;
            242: string;
            243: string;
            245: string;
            246: string;
            302: string;
            303: string;
            304: string;
            305: string;
            307: string;
            308: string;
            309: string;
            310: string;
            311: string;
            312: string;
            313: string;
            314: string;
            315: string;
            320: string;
            395: string;
            423: string;
            424: string;
            433: string;
            452: string;
            455: string;
            462: string;
            478: string;
            511: string;
            512: string;
            520: string;
            522: string;
            524: string;
            525: string;
            526: string;
            527: string;
            528: string;
            529: string;
            530: string;
            531: string;
            532: string;
            578: string;
            580: string;
            581: string;
            582: string;
            583: string;
            585: string;
            586: string;
            587: string;
            588: string;
            589: string;
            590: string;
            591: string;
            597: string;
            610: string;
            616: string;
            656: string;
        };
        export let duration_type: {
            0: string;
            1: string;
        };
        export let epo_cpe_status: {
            0: string;
            1: string;
        };
        export let fairway: {
            0: string;
            1: string;
            2: string;
        };
        export let gender_x: {
            0: string;
            1: string;
            2: string;
        };
        export let gps_mode: {
            bitFlags: boolean;
            '0x0001': string;
            '0x0002': string;
            '0x0010': string;
            '0x0040': string;
            '0x0080': string;
            '0x0100': string;
            '0x1C00': string;
            '0x2000': string;
        };
        export let gps_type: {
            11: string;
            49: string;
        };
        export let guide_text: {
            0: string;
            1: string;
            2: string;
        };
        export let light_sectors_status: {
            0: string;
            1: string;
            2: string;
        };
        export let map_symbol: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
            9: string;
            10: string;
            11: string;
            12: string;
            13: string;
            14: string;
            15: string;
            16: string;
            17: string;
            18: string;
            19: string;
            20: string;
            21: string;
            22: string;
            23: string;
            24: string;
            25: string;
            26: string;
            27: string;
            28: string;
            29: string;
            30: string;
            32: string;
            33: string;
            34: string;
            35: string;
            36: string;
            37: string;
            38: string;
            39: string;
            40: string;
            41: string;
            42: string;
            43: string;
            44: string;
            45: string;
            46: string;
            47: string;
            48: string;
            49: string;
            50: string;
            51: string;
            52: string;
            53: string;
            54: string;
            55: string;
            56: string;
            57: string;
            58: string;
            59: string;
            60: string;
            61: string;
            62: string;
            63: string;
            64: string;
            65: string;
            66: string;
            67: string;
            68: string;
            69: string;
            70: string;
            71: string;
            72: string;
            73: string;
            74: string;
            75: string;
            76: string;
            77: string;
            78: string;
            79: string;
            80: string;
            81: string;
            82: string;
            83: string;
            84: string;
            85: string;
            86: string;
            88: string;
            89: string;
            90: string;
            91: string;
            92: string;
            93: string;
            94: string;
            95: string;
            96: string;
            97: string;
            98: string;
            99: string;
            100: string;
            101: string;
            102: string;
            103: string;
            104: string;
            105: string;
            106: string;
            108: string;
            109: string;
            110: string;
            111: string;
            116: string;
            117: string;
            118: string;
            119: string;
            120: string;
            121: string;
            122: string;
            123: string;
            124: string;
            125: string;
            127: string;
            128: string;
            129: string;
            130: string;
            131: string;
            132: string;
            133: string;
            134: string;
            135: string;
            136: string;
        };
        export let navigation_prompt: {
            1: string;
            2: string;
        };
        export let open_water_event_type: {
            44: string;
        };
        export let orientation: {
            0: string;
            1: string;
        };
        export let power_averaging: {
            0: string;
            1: string;
        };
        export let power_save_timeout: {
            0: string;
            1: string;
        };
        export let record_metric: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let relief_shading: {
            0: string;
            1: string;
            2: string;
        };
        export let route_recalculation: {
            0: string;
            1: string;
            2: string;
        };
        export let routing_mode: {
            0: string;
            1: string;
            2: string;
            4: string;
            5: string;
            6: string;
            11: string;
            12: string;
        };
        export let routing_type: {
            0: string;
            1: string;
        };
        export let running_power_mode: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let satellites: {
            0: string;
            1: string;
            2: string;
            3: string;
            5: string;
            7: string;
            8: string;
            9: string;
        };
        export let screen_type: {
            21: string;
            22: string;
            25: string;
            26: string;
            27: string;
            30: string;
            32: string;
            35: string;
            38: string;
            44: string;
            56: string;
            57: string;
            74: string;
            104: string;
            109: string;
            122: string;
            127: string;
            162: string;
        };
        export let self_evaluation_status: {
            0: string;
            1: string;
            2: string;
        };
        export let sound_and_vibe: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let sport_change: {
            0: string;
            1: string;
        };
        export let touch_status: {
            0: string;
            1: string;
            2: string;
            3: string;
        };
        export let use_status: {
            0: string;
            1: string;
            2: string;
        };
        export let visibility_status: {
            0: string;
            1: string;
        };
        export let volume: {
            1: string;
            2: string;
        };
        export let wind_data_status: {
            0: string;
            1: string;
        };
        export let yes_no: {
            0: string;
            1: string;
        };
        export let zone_metric: {
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        };
    }
    let messages: {
        0: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        1: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        2: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                36: {
                    fieldName: string;
                    fieldType: string;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                };
                40: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                };
                47: {
                    fieldName: string;
                    fieldType: string;
                };
                55: {
                    fieldName: string;
                    fieldType: string;
                };
                56: {
                    fieldName: string;
                    fieldType: string;
                };
                57: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                58: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                59: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                80: {
                    fieldName: string;
                    fieldType: string;
                };
                86: {
                    fieldName: string;
                    fieldType: string;
                };
                89: {
                    fieldName: string;
                    fieldType: string;
                };
                90: {
                    fieldName: string;
                    fieldType: string;
                };
                94: {
                    fieldName: string;
                    fieldType: string;
                };
                95: {
                    fieldName: string;
                    fieldType: string;
                };
                134: {
                    fieldName: string;
                    fieldType: string;
                };
                174: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        3: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    offset: number;
                    undocumented: boolean;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                47: {
                    fieldName: string;
                    fieldType: string;
                };
                49: {
                    fieldName: string;
                    fieldType: string;
                };
                62: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        4: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        5: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        6: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: string;
                    units: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                };
                38: {
                    fieldName: string;
                    fieldType: string;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                40: {
                    fieldName: string;
                    fieldType: string;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                44: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        7: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        8: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        9: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        10: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        12: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
        };
        13: {
            messageName: string;
            fields: {
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                36: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                40: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                42: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                50: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                51: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                52: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                53: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                57: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                63: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                67: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                69: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                70: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                80: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                86: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                87: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                93: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                102: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                103: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                106: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                109: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                110: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                111: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                117: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                119: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1001: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1002: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1003: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1004: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        14: {
            messageName: string;
            fields: {
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        15: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        16: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        17: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                        offset?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        offset?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        offset: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    })[];
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                        offset?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        offset?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        offset: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    })[];
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        18: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                33: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                34: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                36: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                };
                38: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                42: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                43: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                44: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                45: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                };
                47: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                48: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                49: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                50: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                51: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                52: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                53: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                54: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                55: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                56: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                57: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                58: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                59: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                60: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                61: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                62: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                63: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                64: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                65: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                66: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                67: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                68: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                69: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                70: {
                    fieldName: string;
                    fieldType: string;
                };
                71: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                79: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                80: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                82: {
                    fieldName: string;
                    fieldType: string;
                };
                83: {
                    fieldName: string;
                    fieldType: string;
                };
                84: {
                    fieldName: string;
                    fieldType: string;
                };
                85: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                86: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                87: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                88: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                89: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                90: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                91: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                92: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                93: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                94: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                95: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                96: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                97: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                98: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                99: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                100: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                101: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                102: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                103: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                104: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                105: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                110: {
                    fieldName: string;
                    fieldType: string;
                };
                111: {
                    fieldName: string;
                    fieldType: string;
                };
                112: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                113: {
                    fieldName: string;
                    fieldType: string;
                };
                114: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                115: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                116: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                117: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                118: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                119: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                120: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                121: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                122: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                123: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                124: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                125: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                126: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                127: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                128: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                129: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                130: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                131: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                132: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                133: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                134: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                137: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                139: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    bits: number;
                };
                140: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                141: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                142: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                143: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                144: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                145: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                146: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                147: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                148: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                149: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                150: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                155: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                156: {
                    fieldName: string;
                    fieldType: string;
                };
                168: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                169: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                170: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                178: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                180: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                181: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                182: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                183: {
                    fieldName: string;
                    fieldType: string;
                };
                185: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                186: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                187: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                188: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                192: {
                    fieldName: string;
                    fieldType: string;
                };
                193: {
                    fieldName: string;
                    fieldType: string;
                };
                194: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                195: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                196: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                197: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                198: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                199: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                200: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                202: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                205: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                206: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                207: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                208: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                209: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                210: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                212: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        19: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                33: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                34: {
                    fieldName: string;
                    fieldType: string;
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                38: {
                    fieldName: string;
                    fieldType: string;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                };
                40: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                42: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                43: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                44: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                45: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                47: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                48: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                49: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                50: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                51: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                52: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                53: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                54: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                55: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                56: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                57: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                58: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                59: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                60: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                61: {
                    fieldName: string;
                    fieldType: string;
                };
                62: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                63: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                71: {
                    fieldName: string;
                    fieldType: string;
                };
                73: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                74: {
                    fieldName: string;
                    fieldType: string;
                };
                75: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                76: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                77: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                78: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                79: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                80: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                81: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                82: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                83: {
                    fieldName: string;
                    fieldType: string;
                };
                84: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                85: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                86: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                87: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                88: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                89: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                90: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                91: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                92: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                93: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                94: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                95: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                98: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                99: {
                    fieldName: string;
                    fieldType: string;
                };
                100: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                101: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                102: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                103: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                104: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                105: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                106: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                107: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                108: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                109: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                110: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                111: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                112: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                113: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                114: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                115: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                116: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                117: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                118: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                119: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                120: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                121: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    bits: number;
                };
                122: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                123: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                124: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                136: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                137: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                147: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                148: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                149: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                150: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                151: {
                    fieldName: string;
                    fieldType: string;
                };
                153: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                154: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                156: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                157: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                158: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                159: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                160: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                163: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        20: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                        accumulate: number;
                    }[];
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        units: string;
                        bits: number;
                        accumulate: number;
                    }[];
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        units: string;
                        bits: number;
                        accumulate: number;
                    }[];
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                33: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                40: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                42: {
                    fieldName: string;
                    fieldType: string;
                };
                43: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                44: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                45: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                47: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                48: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                49: {
                    fieldName: string;
                    fieldType: string;
                };
                50: {
                    fieldName: string;
                    fieldType: string;
                };
                51: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                52: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                53: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                54: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                55: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                56: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                57: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                58: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                59: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                62: {
                    fieldName: string;
                    fieldType: string;
                };
                67: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                68: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                69: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                70: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                71: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                72: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                73: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                78: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                81: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                82: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                83: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                84: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                85: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                87: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                90: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                91: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                92: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                93: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                94: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                95: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                96: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                97: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                98: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                99: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                108: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                114: {
                    fieldName: string;
                    fieldType: string;
                };
                115: {
                    fieldName: string;
                    fieldType: string;
                };
                116: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                117: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                118: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                119: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                120: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                121: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                123: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                124: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                125: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                126: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                127: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                129: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                136: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                137: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                138: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                139: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                140: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                143: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                144: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        21: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        offset: number;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                        units?: never;
                        components?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        offset?: never;
                        scale?: never;
                        units?: never;
                        components?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        offset?: never;
                        components?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        offset?: never;
                        scale?: never;
                        components?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        components: {
                            fieldDefNumber: number;
                            scale: number;
                            bits: number;
                        }[];
                        offset?: never;
                        scale?: never;
                        units?: never;
                    })[];
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        22: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        23: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        26: {
            messageName: string;
            fields: {
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                        units?: never;
                    })[];
                    undocumented: boolean;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        27: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                        units?: never;
                    })[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                        units?: never;
                    } | {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        28: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        29: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        30: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        31: {
            messageName: string;
            fields: {
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        32: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        33: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        34: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        35: {
            messageName: string;
            fields: {
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        37: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        38: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        39: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        49: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        51: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        53: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        55: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                33: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                34: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        70: {
            messageName: string;
            fields: {
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        71: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        72: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        78: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
            };
        };
        79: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        80: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        81: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        82: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        89: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        101: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        103: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        104: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        106: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
            };
        };
        113: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        114: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    subfields: ({
                        fieldName: string;
                        fieldType: string;
                        scale: number;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    } | {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                        scale?: never;
                    })[];
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        127: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        128: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        129: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        131: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        132: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    components: ({
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                        accumulate: number;
                    } | {
                        fieldDefNumber: number;
                        scale: number;
                        bits: number;
                        accumulate: number;
                        units?: never;
                    })[];
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        140: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    source: number;
                    undocumented: boolean;
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                36: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                48: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                50: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                60: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                61: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                62: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                63: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        141: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        142: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                31: {
                    fieldName: string;
                    fieldType: string;
                };
                32: {
                    fieldName: string;
                    fieldType: string;
                };
                33: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                34: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                36: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                38: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                39: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                40: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                41: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                42: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                43: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                44: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                45: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                47: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                48: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                49: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                50: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                51: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                52: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                53: {
                    fieldName: string;
                    fieldType: string;
                };
                54: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                55: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                56: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                57: {
                    fieldName: string;
                    fieldType: string;
                };
                58: {
                    fieldName: string;
                    fieldType: string;
                };
                59: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                60: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                61: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                62: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                63: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                64: {
                    fieldName: string;
                    fieldType: string;
                };
                65: {
                    fieldName: string;
                    fieldType: string;
                };
                66: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                67: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                68: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                69: {
                    fieldName: string;
                    fieldType: string;
                };
                70: {
                    fieldName: string;
                    fieldType: string;
                };
                71: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                72: {
                    fieldName: string;
                    fieldType: string;
                };
                73: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                74: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                75: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                76: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                77: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                78: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                79: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                80: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                81: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                82: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                83: {
                    fieldName: string;
                    fieldType: string;
                };
                84: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                85: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                86: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                87: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                89: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                90: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                91: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                92: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                93: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        143: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        144: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        145: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                250: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        147: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    source: number;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                45: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                46: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                51: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        148: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        149: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        150: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        offset: number;
                        units: string;
                        bits: number;
                    }[];
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        151: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        152: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        158: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        159: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        160: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        161: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        162: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        164: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        165: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        167: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        169: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        170: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                    undocumented: boolean;
                };
                100: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                101: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        173: {
            messageName: string;
            fields: {
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        174: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        177: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        178: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        184: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        185: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        186: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        187: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        188: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        190: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        191: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        192: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        193: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        194: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        200: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        201: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
            };
        };
        202: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        206: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        207: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        208: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        209: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        210: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        units: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        211: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        216: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        225: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        227: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
        };
        229: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        233: {
            messageName: string;
            fields: {
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        243: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        258: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                18: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                19: {
                    fieldName: string;
                    fieldType: string;
                };
                20: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                29: {
                    fieldName: string;
                    fieldType: string;
                };
                30: {
                    fieldName: string;
                    fieldType: string;
                };
                35: {
                    fieldName: string;
                    fieldType: string;
                };
                36: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                37: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        259: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        262: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        264: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        268: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                16: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                17: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        269: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        275: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        285: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    components: {
                        fieldDefNumber: number;
                        scale: number;
                        units: string;
                        bits: number;
                    }[];
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        288: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        289: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        290: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        297: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        302: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        304: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        305: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        306: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        307: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        308: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        309: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        310: {
            messageName: string;
            fields: {
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        311: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                    undocumented: boolean;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        312: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                21: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                22: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                23: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                25: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                27: {
                    fieldName: string;
                    fieldType: string;
                };
                28: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                74: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    offset: number;
                    units: string;
                };
                110: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        313: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                13: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                77: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        314: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        315: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        317: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        319: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        321: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        323: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        324: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        325: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        326: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    subfields: {
                        fieldName: string;
                        fieldType: string;
                        map: {
                            name: string;
                            value: string;
                        }[];
                    }[];
                    undocumented: boolean;
                };
                100: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                101: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                102: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                104: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                105: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                106: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                107: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                108: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                109: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                110: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                113: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        327: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        346: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                };
                14: {
                    fieldName: string;
                    fieldType: string;
                };
                15: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                };
            };
        };
        358: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                12: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
                24: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                26: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        370: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        371: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        372: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    components: {
                        fieldDefNumber: number;
                        bits: number;
                    }[];
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        375: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        376: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        379: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    units: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        387: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        388: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        389: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        393: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                };
                8: {
                    fieldName: string;
                    fieldType: string;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                };
                10: {
                    fieldName: string;
                    fieldType: string;
                };
                11: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                };
                254: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        394: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
        398: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                };
                2: {
                    fieldName: string;
                    fieldType: string;
                };
                4: {
                    fieldName: string;
                    fieldType: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                };
            };
        };
        409: {
            messageName: string;
            fields: {
                0: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
                1: {
                    fieldName: string;
                    fieldType: string;
                    array: string;
                    scale: number;
                    units: string;
                };
                253: {
                    fieldName: string;
                    fieldType: string;
                    units: string;
                };
            };
        };
        428: {
            messageName: string;
            fields: {
                1: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                3: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                5: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                6: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    undocumented: boolean;
                };
                7: {
                    fieldName: string;
                    fieldType: string;
                    undocumented: boolean;
                };
                9: {
                    fieldName: string;
                    fieldType: string;
                    scale: number;
                    units: string;
                    undocumented: boolean;
                };
            };
            undocumented: boolean;
        };
    };
    let mesgNum: {
        file_id: number;
        capabilities: number;
        device_settings: number;
        user_profile: number;
        hrm_profile: number;
        sdm_profile: number;
        bike_profile: number;
        zones_target: number;
        hr_zone: number;
        power_zone: number;
        met_zone: number;
        sport: number;
        goal: number;
        session: number;
        lap: number;
        record: number;
        event: number;
        device_info: number;
        workout: number;
        workout_step: number;
        schedule: number;
        weight_scale: number;
        course: number;
        course_point: number;
        totals: number;
        activity: number;
        software: number;
        file_capabilities: number;
        mesg_capabilities: number;
        field_capabilities: number;
        file_creator: number;
        blood_pressure: number;
        speed_zone: number;
        monitoring: number;
        training_file: number;
        hrv: number;
        ant_rx: number;
        ant_tx: number;
        ant_channel_id: number;
        length: number;
        monitoring_info: number;
        pad: number;
        slave_device: number;
        connectivity: number;
        weather_conditions: number;
        weather_alert: number;
        cadence_zone: number;
        hr: number;
        segment_lap: number;
        memo_glob: number;
        segment_id: number;
        segment_leaderboard_entry: number;
        segment_point: number;
        segment_file: number;
        workout_session: number;
        watchface_settings: number;
        gps_metadata: number;
        camera_event: number;
        timestamp_correlation: number;
        gyroscope_data: number;
        accelerometer_data: number;
        three_d_sensor_calibration: number;
        video_frame: number;
        obdii_data: number;
        nmea_sentence: number;
        aviation_attitude: number;
        video: number;
        video_title: number;
        video_description: number;
        video_clip: number;
        ohr_settings: number;
        exd_screen_configuration: number;
        exd_data_field_configuration: number;
        exd_data_concept_configuration: number;
        field_description: number;
        developer_data_id: number;
        magnetometer_data: number;
        barometer_data: number;
        one_d_sensor_calibration: number;
        monitoring_hr_data: number;
        time_in_zone: number;
        set: number;
        stress_level: number;
        max_met_data: number;
        dive_settings: number;
        dive_gas: number;
        dive_alarm: number;
        exercise_title: number;
        dive_summary: number;
        spo2_data: number;
        sleep_level: number;
        jump: number;
        aad_accel_features: number;
        beat_intervals: number;
        respiration_rate: number;
        hsa_accelerometer_data: number;
        hsa_step_data: number;
        hsa_spo2_data: number;
        hsa_stress_data: number;
        hsa_respiration_data: number;
        hsa_heart_rate_data: number;
        split: number;
        split_summary: number;
        hsa_body_battery_data: number;
        hsa_event: number;
        climb_pro: number;
        tank_update: number;
        tank_summary: number;
        sleep_assessment: number;
        hrv_status_summary: number;
        hrv_value: number;
        raw_bbi: number;
        device_aux_battery_info: number;
        hsa_gyroscope_data: number;
        chrono_shot_session: number;
        chrono_shot_data: number;
        hsa_configuration_data: number;
        dive_apnea_alarm: number;
        skin_temp_overnight: number;
        hsa_wrist_temperature_data: number;
        mfg_range_min: string;
        mfg_range_max: string;
        sport_settings: number;
        data_screen: number;
        alert: number;
        range_alert: number;
        device_used: number;
        location: number;
        map_layer: number;
        routing: number;
        user_metrics: number;
        open_water_event: number;
        device_status: number;
        best_effort: number;
        personal_record: number;
        activity_metrics: number;
        epo_status: number;
        multisport_settings: number;
        multisport_activity: number;
        sensor_settings: number;
        metronome: number;
        'mesg_162?': number;
        connect_iq_field: number;
        clubs: number;
        golf_course: number;
        golf_stats: number;
        score: number;
        hole: number;
        shot: number;
        'mesg_233?': number;
        music_info: number;
        'mesg_288?': number;
        mtb_cx: number;
        race: number;
        split_time: number;
        power_mode: number;
        'mesg_324?': number;
        'mesg_325?': number;
        gps_event: number;
        'mesg_327?': number;
        race_event: number;
        sleep_schedule: number;
        cpe_status: number;
        workout_schedule: number;
    };
}
declare function x(i: any): string;
export { e as B, h as C, p as D, s as F, N as I, n as N, y as R, g as S, f as T, w as a, T as b, z as c, l as d, b as e, u as f, o as g, v as h, r as i, c as j, k as n, m as p, x as u };
//# sourceMappingURL=isUnknown-BvXlyTdW.d.ts.map