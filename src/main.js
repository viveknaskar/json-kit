/* ============================================
   main.js — Entry point
   ============================================ */

// Styles
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/tools.css'

// App shell
import App from './core/App.js'

// Tool modules
import { init as initFormatJson    } from './tools/FormatJson.js'
import { init as initMinifyJson    } from './tools/MinifyJson.js'
import { init as initSortKeys      } from './tools/SortKeys.js'
import { init as initJsonToCsv     } from './tools/JsonToCsv.js'
import { init as initCsvToJson     } from './tools/CsvToJson.js'
import { init as initJsonToYaml    } from './tools/JsonToYaml.js'
import { init as initYamlToJson    } from './tools/YamlToJson.js'
import { init as initJsonDiff      } from './tools/JsonDiff.js'
import { init as initJsonSchema    } from './tools/JsonSchema.js'
import { init as initFlattenJson   } from './tools/FlattenJson.js'
import { init as initUnflattenJson } from './tools/UnflattenJson.js'
import { init as initJsonQuery     } from './tools/JsonQuery.js'
import { init as initRepairJson   } from './tools/RepairJson.js'
import { init as initEscapeJson   } from './tools/EscapeJson.js'
import { init as initJsonMerge    } from './tools/JsonMerge.js'

document.addEventListener('DOMContentLoaded', () => {
  // Boot the SPA shell
  const app = new App(document.getElementById('app'))

  // Initialize all tools (wire up event listeners)
  initFormatJson()
  initMinifyJson()
  initSortKeys()
  initJsonToCsv()
  initCsvToJson()
  initJsonToYaml()
  initYamlToJson()
  initJsonDiff()
  initJsonSchema()
  initFlattenJson()
  initUnflattenJson()
  initJsonQuery()
  initRepairJson()
  initJsonMerge()

  // Restore view from URL hash (e.g. direct link to a tool)
  app.restoreFromHash()
})
