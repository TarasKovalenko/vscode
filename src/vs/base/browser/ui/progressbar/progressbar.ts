/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./progressbar';
import * as assert from 'vs/base/common/assert';
import { Builder, $ } from 'vs/base/browser/builder';
import { Disposable } from 'vs/base/common/lifecycle';
import { Color } from 'vs/base/common/color';
import { mixin } from 'vs/base/common/objects';

const css_done = 'done';
const css_active = 'active';
const css_infinite = 'infinite';
const css_discrete = 'discrete';
const css_progress_container = 'monaco-progress-container';
const css_progress_bit = 'progress-bit';

export interface IProgressBarOptions extends IProgressBarStyles {
}

export interface IProgressBarStyles {
	progressBarBackground?: Color;
}

const defaultOpts = {
	progressBarBackground: Color.fromHex('#0E70C0')
};

/**
 * A progress bar with support for infinite or discrete progress.
 */
export class ProgressBar extends Disposable {
	private options: IProgressBarOptions;
	private workedVal: number;
	private element: Builder;
	private bit: HTMLElement;
	private totalWork: number;
	private progressBarBackground: Color;

	constructor(container: HTMLElement, options?: IProgressBarOptions) {
		super();

		this.options = options || Object.create(null);
		mixin(this.options, defaultOpts, false);

		this.workedVal = 0;

		this.progressBarBackground = this.options.progressBarBackground;

		this.create(container);
	}

	private create(container: HTMLElement): void {
		$(container).div({ 'class': css_progress_container }, builder => {
			this.element = builder.clone();
			this.bit = builder.div({ 'class': css_progress_bit }).getHTMLElement();
		});

		this.applyStyles();
	}

	private off(): void {
		this.bit.style.width = 'inherit';
		this.bit.style.opacity = '1';
		this.element.removeClass(css_active);
		this.element.removeClass(css_infinite);
		this.element.removeClass(css_discrete);

		this.workedVal = 0;
		this.totalWork = undefined;
	}

	/**
	 * Indicates to the progress bar that all work is done.
	 */
	done(): ProgressBar {
		return this.doDone(true);
	}

	/**
	 * Stops the progressbar from showing any progress instantly without fading out.
	 */
	stop(): ProgressBar {
		return this.doDone(false);
	}

	private doDone(delayed: boolean): ProgressBar {
		this.element.addClass(css_done);

		// let it grow to 100% width and hide afterwards
		if (!this.element.hasClass(css_infinite)) {
			this.bit.style.width = 'inherit';

			if (delayed) {
				setTimeout(200, () => this.off());
			} else {
				this.off();
			}
		}

		// let it fade out and hide afterwards
		else {
			this.bit.style.opacity = '0';
			if (delayed) {
				setTimeout(200, () => this.off());
			} else {
				this.off();
			}
		}

		return this;
	}

	/**
	 * Use this mode to indicate progress that has no total number of work units.
	 */
	infinite(): ProgressBar {
		this.bit.style.width = '2%';
		this.bit.style.opacity = '1';

		this.element.removeClass(css_discrete);
		this.element.removeClass(css_done);
		this.element.addClass(css_active);
		this.element.addClass(css_infinite);

		return this;
	}

	/**
	 * Tells the progress bar the total number of work. Use in combination with workedVal() to let
	 * the progress bar show the actual progress based on the work that is done.
	 */
	total(value: number): ProgressBar {
		this.workedVal = 0;
		this.totalWork = value;

		return this;
	}

	/**
	 * Finds out if this progress bar is configured with total work
	 */
	hasTotal(): boolean {
		return !isNaN(this.totalWork);
	}

	/**
	 * Tells the progress bar that an increment of work has been completed.
	 */
	worked(value: number): ProgressBar {
		value = Number(value);
		assert.ok(!isNaN(value), 'Value is not a number');
		value = Math.max(1, value);

		return this.doSetWorked(this.workedVal + value);
	}

	/**
	 * Tells the progress bar the total amount of work that has been completed.
	 */
	setWorked(value: number): ProgressBar {
		value = Number(value);
		assert.ok(!isNaN(value), 'Value is not a number');
		value = Math.max(1, value);

		return this.doSetWorked(value);
	}

	private doSetWorked(value: number): ProgressBar {
		assert.ok(!isNaN(this.totalWork), 'Total work not set');

		this.workedVal = value;
		this.workedVal = Math.min(this.totalWork, this.workedVal);

		if (this.element.hasClass(css_infinite)) {
			this.element.removeClass(css_infinite);
		}

		if (this.element.hasClass(css_done)) {
			this.element.removeClass(css_done);
		}

		if (!this.element.hasClass(css_active)) {
			this.element.addClass(css_active);
		}

		if (!this.element.hasClass(css_discrete)) {
			this.element.addClass(css_discrete);
		}

		this.bit.style.width = 100 * (this.workedVal / this.totalWork) + '%';

		return this;
	}

	getContainer(): HTMLElement {
		return this.element.getHTMLElement();
	}

	show(delay?: number): void {
		if (typeof delay === 'number') {
			this.element.showDelayed(delay);
		} else {
			this.element.show();
		}
	}

	hide(): void {
		this.element.hide();
	}

	style(styles: IProgressBarStyles): void {
		this.progressBarBackground = styles.progressBarBackground;

		this.applyStyles();
	}

	protected applyStyles(): void {
		if (this.bit) {
			const background = this.progressBarBackground ? this.progressBarBackground.toString() : null;

			this.bit.style.backgroundColor = background;
		}
	}
}