import { VersionGraph } from '@start9labs/start-sdk'
import { v_1_45_0_0 } from './v1.45.0.0'
import { v_1_45_0_1 } from './v1.45.0.1'

export const versionGraph = VersionGraph.of({
  current: v_1_45_0_1,
  other: [v_1_45_0_0],
})
