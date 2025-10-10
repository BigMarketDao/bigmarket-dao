/// <reference types="vitest" />

import { getClarinetVitestsArgv, vitestSetupFilePath } from '@hirosystems/clarinet-sdk/vitest';
import { defineConfig } from 'vite';

export default defineConfig({
	test: {
		environment: 'clarinet',
		setupFiles: [vitestSetupFilePath, 'vitest.setup.ts'],
		include: ['./tests/**/*.test.ts'],
		reporters: ['default', 'json', 'junit'],
		outputFile: {
			json: 'reports/report.json',
			junit: 'reports/report.xml'
		},
		pool: 'forks',
		poolOptions: { forks: { singleFork: true } },
		environmentOptions: {
			clarinet: { ...getClarinetVitestsArgv() }
		}
	}
});
