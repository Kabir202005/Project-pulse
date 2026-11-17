import { request } from './api';
import { WhatIfInput, WhatIfPoint } from '../types';

export const whatIfService = {
  runWhatIf: async (input: WhatIfInput): Promise<WhatIfPoint[]> => {
    return request<WhatIfPoint[]>('/what-if', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
