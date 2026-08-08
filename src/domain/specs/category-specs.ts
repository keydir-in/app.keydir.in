/**
 * Per-category spec configuration definitions. Defines the types, groups,
 * rows, and hero fields used to render product detail spec tables and
 * filter panels for keyboards, switches, keycaps, and mice.
 */
export type SpecRowType =
  | 'string' | 'string[]' | 'boolean' | 'number' | 'number_unit'
  | 'colors' | 'tags' | 'bool_badges' | 'feature_badges'
  | 'perf_grid' | 'materials' | 'switch_status'
  | 'switch_options' | 'keycap_options';

export interface SpecRowDef {
  type: SpecRowType;
  label: string;
  key?: string;
  unit?: string;
  fields?: { label: string; key: string; unit?: string }[];
}

export interface SpecGroupDef {
  title: string;
  rows: SpecRowDef[];
}

export interface HeroFieldDef {
  label: string;
  icon: string;
  key: string;
  type: 'string' | 'string[]' | 'number';
  joiner?: string;
  unit?: string;
}

export interface CategorySpecConfig {
  heroFields: HeroFieldDef[];
  groups: SpecGroupDef[];
}

export const CATEGORY_SPECS: Record<string, CategorySpecConfig> = {
  keyboards: {
    heroFields: [
      { label: 'Layout', icon: '⌨', key: 'layout', type: 'string' },
      { label: 'Case Material', icon: '▣', key: 'caseMaterial', type: 'string' },
      { label: 'Connectivity', icon: '⚡', key: 'connectivity', type: 'string[]', joiner: ' • ' },
      { label: 'Firmware', icon: '⌘', key: 'firmware', type: 'string[]', joiner: ' • ' },
    ],
    groups: [
      {
        title: 'Layout & Build',
        rows: [
          { type: 'string', label: 'Layout', key: 'layout' },
          { type: 'string[]', label: 'Style', key: 'keyboardStyle' },
          { type: 'string', label: 'Case Material', key: 'caseMaterial' },
          { type: 'string[]', label: 'Surface Finish', key: 'surfaceFinish' },
          { type: 'number_unit', label: 'Weight', key: 'weight', unit: 'g' },
        ],
      },
      {
        title: 'Dimensions',
        rows: [
          { type: 'number_unit', label: 'Length', key: 'lengthMm', unit: 'mm' },
          { type: 'number_unit', label: 'Width', key: 'widthMm', unit: 'mm' },
          { type: 'number_unit', label: 'Front Height', key: 'frontHeightMm', unit: 'mm' },
          { type: 'number_unit', label: 'Rear Height', key: 'rearHeightMm', unit: 'mm' },
          { type: 'number_unit', label: 'Typing Angle', key: 'typingAngle', unit: '°' },
        ],
      },
      {
        title: 'Mounting & Internals',
        rows: [
          { type: 'string[]', label: 'Mounting Style', key: 'mountingStyle' },
          { type: 'string[]', label: 'Plate Material', key: 'plateMaterial' },
          { type: 'string[]', label: 'Stabilizers', key: 'stabilizerCompat' },
          { type: 'string[]', label: 'Stabilizer Layout', key: 'stabilizerLayout' },
        ],
      },
      {
        title: 'Foam Configuration',
        rows: [
          { type: 'string[]', label: 'Foam Material', key: 'foamMaterial' },
          { type: 'string[]', label: 'Foam Placement', key: 'foamPlacement' },
        ],
      },
      {
        title: 'PCB',
        rows: [
          { type: 'string[]', label: 'PCB Type', key: 'pcbType' },
          { type: 'number_unit', label: 'Thickness', key: 'pcbThickness', unit: 'mm' },
          { type: 'number_unit', label: 'Polling Rate', key: 'pollingRate', unit: 'Hz' },
          { type: 'boolean', label: 'NKRO', key: 'nkro' },
          { type: 'boolean', label: 'Flex Cuts', key: 'flexCuts' },
          { type: 'number_unit', label: 'Battery', key: 'batteryCapacity', unit: 'mAh' },
        ],
      },
      {
        title: 'Connectivity',
        rows: [
          { type: 'string[]', label: 'Type', key: 'connectivity' },
          { type: 'boolean', label: 'Detachable Cable', key: 'detachableCable' },
        ],
      },
      {
        title: 'Firmware',
        rows: [
          { type: 'string[]', label: 'Supported', key: 'firmware' },
        ],
      },
      {
        title: 'Lighting',
        rows: [
          { type: 'string', label: 'Lighting', key: 'lighting' },
          { type: 'string', label: 'LED Orientation', key: 'ledOrientation' },
          { type: 'boolean', label: 'Per-Key RGB', key: 'perKeyRgb' },
        ],
      },
      {
        title: 'Keycaps',
        rows: [
          { type: 'keycap_options', label: 'Keycap Options', key: 'keycaps' },
        ],
      },
      {
        title: 'Switches',
        rows: [
          { type: 'switch_status', label: 'Switches', key: 'switchesIncluded' },
          { type: 'switch_options', label: 'Switch Options', key: 'switches' },
        ],
      },
      {
        title: 'Accessories',
        rows: [
          { type: 'string[]', label: 'Included', key: 'includedAccessories' },
          { type: 'string', label: 'Additional', key: 'additionalAccessories' },
          { type: 'string', label: 'Special Features', key: 'specialFeatures' },
        ],
      },
    ],
  },

  switches: {
    heroFields: [
      { label: 'Type', icon: '🔘', key: 'switchType', type: 'string[]' },
      { label: 'Operating Force', icon: '⚖', key: 'switchOpForce', type: 'number', unit: ' gf' },
      { label: 'Bottom-out Force', icon: '⚖', key: 'switchBottomOut', type: 'number', unit: ' gf' },
      { label: 'Compatible Sockets', icon: '🔌', key: 'switchCompat', type: 'string[]' },
    ],
    groups: [
      {
        title: 'Type & Compatibility',
        rows: [
          { type: 'tags', label: 'Type', key: 'switchType' },
          { type: 'tags', label: 'Compatibility', key: 'switchCompat' },
          { type: 'tags', label: 'Brands', key: 'switchBrand' },
          { type: 'tags', label: 'Models', key: 'switchModel' },
        ],
      },
      {
        title: 'Features',
        rows: [
          { type: 'boolean', label: 'Factory Lubed', key: 'factoryLubed' },
          { type: 'boolean', label: 'Hand Lubed', key: 'handLubed' },
          { type: 'boolean', label: 'Factory Filmed', key: 'factoryFilmed' },
          { type: 'boolean', label: 'Break-in Completed', key: 'breakInProgress' },
        ],
      },
      {
        title: 'Performance',
        rows: [
          { type: 'number_unit', label: 'Operating Force', key: 'switchOpForce', unit: 'gf' },
          { type: 'number_unit', label: 'Bottom-out Force', key: 'switchBottomOut', unit: 'gf' },
          { type: 'number_unit', label: 'Pre-Travel', key: 'switchPreTravel', unit: 'mm' },
          { type: 'number_unit', label: 'Total Travel', key: 'switchTotalTravel', unit: 'mm' },
          { type: 'number_unit', label: 'Spring Weight', key: 'switchSpringWeight', unit: 'gf' },
          { type: 'number_unit', label: 'Spring Length', key: 'switchSpringLength', unit: 'mm' },
          { type: 'number_unit', label: 'Rated Lifetime', key: 'switchRatedLifetime', unit: ' Million' },
        ],
      },
      {
        title: 'Materials',
        rows: [
          { type: 'string', label: 'Stem Material', key: 'switchStemMaterial' },
          { type: 'string', label: 'Top Housing', key: 'switchTopHousing' },
          { type: 'string', label: 'Bottom Housing', key: 'switchBottomHousing' },
          { type: 'string', label: 'Spring Type', key: 'switchSpringType' },
        ],
      },
      {
        title: 'Additional Features',
        rows: [
          { type: 'boolean', label: 'Long Pole', key: 'switchLongPole' },
          { type: 'boolean', label: 'LED Diffuser', key: 'switchLedDiffuser' },
          { type: 'boolean', label: 'Dustproof Stem', key: 'switchDustproofStem' },
          { type: 'boolean', label: 'Light Pipe', key: 'switchLightPipe' },
        ],
      },
      {
        title: 'Packaging',
        rows: [
          { type: 'number', label: 'Quantity per Pack', key: 'quantityPerPack' },
          { type: 'string', label: 'Packaging Type', key: 'packagingType' },
        ],
      },
    ],
  },

  keycaps: {
    heroFields: [
      { label: 'Profile', icon: '🎨', key: 'keycapProfile', type: 'string[]' },
      { label: 'Material', icon: '📦', key: 'keycapMaterial', type: 'string[]' },
      { label: 'Legend Type', icon: '✏', key: 'keycapLegends', type: 'string[]' },
      { label: 'Key Count', icon: '🔢', key: 'keycapKeyCount', type: 'string[]' },
    ],
    groups: [
      {
        title: 'Profile & Layout',
        rows: [
          { type: 'string[]', label: 'Profile', key: 'keycapProfile' },
          { type: 'string[]', label: 'Layout Support', key: 'keycapLayoutSupport' },
        ],
      },
      {
        title: 'Material & Manufacturing',
        rows: [
          { type: 'string[]', label: 'Material', key: 'keycapMaterial' },
          { type: 'string[]', label: 'Manufacturing', key: 'keycapManufacturing' },
        ],
      },
      {
        title: 'Legends',
        rows: [
          { type: 'string[]', label: 'Legend Type', key: 'keycapLegends' },
          { type: 'string[]', label: 'Legend Placement', key: 'keycapLegendPlacement' },
        ],
      },
      {
        title: 'Language & Layout',
        rows: [
          { type: 'string[]', label: 'Language', key: 'keycapLanguage' },
          { type: 'string[]', label: 'Key Count', key: 'keycapKeyCount' },
          { type: 'string[]', label: 'Stem Compatibility', key: 'keycapStemCompat' },
        ],
      },
      {
        title: 'Physical',
        rows: [
          { type: 'string', label: 'Thickness', key: 'keycapThickness' },
        ],
      },
      {
        title: 'Identity',
        rows: [
          { type: 'string', label: 'Colorway', key: 'keycapColorway' },
          { type: 'string[]', label: 'Manufacturer', key: 'keycapManufacturer' },
          { type: 'string', label: 'Designer', key: 'keycapDesigner' },
        ],
      },
      {
        title: 'Inclusions',
        rows: [
          { type: 'boolean', label: 'Novelties', key: 'keycapNovelties' },
          { type: 'boolean', label: 'Spacebars', key: 'keycapSpacebars' },
          { type: 'boolean', label: 'Accent Keys', key: 'keycapAccentKeys' },
          { type: 'boolean', label: 'Artisan', key: 'keycapArtisan' },
        ],
      },
      {
        title: 'Notes',
        rows: [
          { type: 'string', label: 'Notes', key: 'keycapNotes' },
        ],
      },
    ],
  },

  mouse: {
    heroFields: [
      { label: 'Sensor', icon: '🖱', key: 'mouseSensor', type: 'string' },
      { label: 'DPI', icon: '📐', key: 'mouseDpi', type: 'number' },
      { label: 'Weight', icon: '⚖', key: 'mouseWeight', type: 'number', unit: 'g' },
      { label: 'Connection', icon: '⚡', key: 'mouseConnection', type: 'string[]' },
    ],
    groups: [
      {
        title: 'Connection & Sensor',
        rows: [
          { type: 'string[]', label: 'Connection', key: 'mouseConnection' },
          { type: 'string', label: 'Sensor', key: 'mouseSensor' },
          { type: 'number', label: 'DPI', key: 'mouseDpi' },
        ],
      },
      {
        title: 'Performance',
        rows: [
          { type: 'string[]', label: 'Polling Rate', key: 'mousePollingRate' },
          { type: 'number', label: 'Max IPS', key: 'mouseMaxIps' },
          { type: 'number_unit', label: 'Max Acceleration', key: 'mouseMaxAccel', unit: 'G' },
          { type: 'string', label: 'Lift-off Distance', key: 'mouseLod' },
        ],
      },
      {
        title: 'Physical',
        rows: [
          { type: 'number_unit', label: 'Weight', key: 'mouseWeight', unit: 'g' },
          { type: 'string', label: 'Shape', key: 'mouseShape' },
          { type: 'string', label: 'Hand Orientation', key: 'mouseHandOrientation' },
          { type: 'string', label: 'Size', key: 'mouseSize' },
          { type: 'number_unit', label: 'Length', key: 'mouseDimensionsLength', unit: 'mm' },
          { type: 'number_unit', label: 'Width', key: 'mouseDimensionsWidth', unit: 'mm' },
          { type: 'number_unit', label: 'Height', key: 'mouseDimensionsHeight', unit: 'mm' },
        ],
      },
      {
        title: 'Switches & Input',
        rows: [
          { type: 'string', label: 'Switches', key: 'mouseSwitches' },
          { type: 'string', label: 'Encoder', key: 'mouseEncoder' },
          { type: 'number', label: 'Buttons', key: 'mouseButtons' },
          { type: 'number', label: 'Side Buttons', key: 'mouseSideButtons' },
          { type: 'string', label: 'Scroll Wheel', key: 'mouseScrollWheel' },
        ],
      },
      {
        title: 'Power',
        rows: [
          { type: 'number_unit', label: 'Battery', key: 'mouseBattery', unit: 'mAh' },
          { type: 'string', label: 'Battery Life', key: 'mouseBatteryLife' },
          { type: 'string', label: 'Charging Port', key: 'mouseChargingPort' },
        ],
      },
      {
        title: 'Build & Features',
        rows: [
          { type: 'string', label: 'Feet', key: 'mouseFeet' },
          { type: 'boolean', label: 'RGB', key: 'mouseRgb' },
          { type: 'boolean', label: 'Software Required', key: 'mouseSoftwareRequired' },
          { type: 'boolean', label: 'Onboard Memory', key: 'mouseOnboardMemory' },
          { type: 'string', label: 'Shell Material', key: 'mouseShellMaterial' },
          { type: 'string[]', label: 'Grip Type', key: 'mouseGripType' },
          { type: 'string', label: 'Color', key: 'mouseColor' },
        ],
      },
      {
        title: 'Compatibility',
        rows: [
          { type: 'string[]', label: 'Compatibility', key: 'mouseCompatibility' },
        ],
      },
      {
        title: 'Included',
        rows: [
          { type: 'string[]', label: 'Accessories', key: 'mouseAccessories' },
          { type: 'string', label: 'Other Accessories', key: 'mouseAccessoriesOther' },
        ],
      },
      {
        title: 'Warranty',
        rows: [
          { type: 'string', label: 'Warranty', key: 'mouseWarranty' },
        ],
      },
    ],
  },
};
