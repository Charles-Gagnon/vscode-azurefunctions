/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import * as fse from 'fs-extra';
import * as path from 'path';
import { localize } from '../../localize';
import { IFunctionTemplate } from '../../templates/IFunctionTemplate';
import { nonNullProp } from '../../utils/nonNull';
import { IFunctionWizardContext } from './IFunctionWizardContext';

export abstract class FunctionNameStepBase<T extends IFunctionWizardContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        const template: IFunctionTemplate = nonNullProp(context, 'functionTemplate');
        const uniqueFunctionName: string | undefined = await this.getUniqueFunctionName(context);
        context.functionName = await context.ui.showInputBox({
            placeHolder: localize('funcNamePlaceholder', 'Function name'),
            prompt: localize('funcNamePrompt', 'Provide a function name'),
            validateInput: async (s: string): Promise<string | undefined> => await this.validateFunctionName(context, s),
            value: uniqueFunctionName || template.defaultFunctionName
        });
    }

    public shouldPrompt(context: T): boolean {
        return !context.functionName;
    }

    protected abstract getUniqueFunctionName(context: T): Promise<string | undefined>;
    protected abstract validateFunctionNameCore(context: T, name: string): Promise<string | undefined>;

    /**
     * NOTE: This will always at least add `1` to the default value to (hopefully) make clear the function name is an instance of the template
     */
    protected async getUniqueFsPath(folderPath: string, defaultValue: string, fileExtension?: string): Promise<string | undefined> {
        let count: number = 1;
        const maxCount: number = 1024;

        while (count < maxCount) {
            const fileName: string = defaultValue + count.toString();
            if (!(await fse.pathExists(path.join(folderPath, fileExtension ? fileName + fileExtension : fileName)))) {
                return fileName;
            }
            count += 1;
        }

        return undefined;
    }

    private async validateFunctionName(context: T, name: string | undefined): Promise<string | undefined> {
        if (!name) {
            return localize('emptyTemplateNameError', 'The function name cannot be empty.');
        } else if (!/^[a-z][a-z\d_\-]*$/i.test(name)) {
            return localize('functionNameInvalidMessage', 'Function name must start with a letter and can only contain letters, digits, "_" and "-".');
        } else {
            return await this.validateFunctionNameCore(context, name);
        }
    }
}
