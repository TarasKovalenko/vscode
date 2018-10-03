/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/panelpart';
import * as nls from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { Action } from 'vs/base/common/actions';
import { Registry } from 'vs/platform/registry/common/platform';
import { SyncActionDescriptor, MenuId, MenuRegistry } from 'vs/platform/actions/common/actions';
import { IWorkbenchActionRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/actions';
import { IPanelService } from 'vs/workbench/services/panel/common/panelService';
import { IPartService, Parts, Position } from 'vs/workbench/services/part/common/partService';
import { ActivityAction } from 'vs/workbench/browser/parts/compositeBarActions';
import { IActivity } from 'vs/workbench/common/activity';

export class ClosePanelAction extends Action {

	static readonly ID = 'workbench.action.closePanel';
	static LABEL = nls.localize('closePanel', "Close Panel");

	constructor(
		id: string,
		name: string,
		@IPartService private partService: IPartService
	) {
		super(id, name, 'hide-panel-action');
	}

	run(): TPromise<any> {
		return this.partService.setPanelHidden(true);
	}
}

export class TogglePanelAction extends Action {

	static readonly ID = 'workbench.action.togglePanel';
	static LABEL = nls.localize('togglePanel', "Toggle Panel");

	constructor(
		id: string,
		name: string,
		@IPartService private partService: IPartService
	) {
		super(id, name, partService.isVisible(Parts.PANEL_PART) ? 'panel expanded' : 'panel');
	}

	run(): TPromise<any> {
		return this.partService.setPanelHidden(this.partService.isVisible(Parts.PANEL_PART));
	}
}

class FocusPanelAction extends Action {

	static readonly ID = 'workbench.action.focusPanel';
	static readonly LABEL = nls.localize('focusPanel', "Focus into Panel");

	constructor(
		id: string,
		label: string,
		@IPanelService private panelService: IPanelService,
		@IPartService private partService: IPartService
	) {
		super(id, label);
	}

	run(): TPromise<any> {

		// Show panel
		if (!this.partService.isVisible(Parts.PANEL_PART)) {
			return this.partService.setPanelHidden(false);
		}

		// Focus into active panel
		let panel = this.panelService.getActivePanel();
		if (panel) {
			panel.focus();
		}
		return Promise.resolve(true);
	}
}

export class TogglePanelPositionAction extends Action {

	static readonly ID = 'workbench.action.togglePanelPosition';
	static readonly LABEL = nls.localize('toggledPanelPosition', "Toggle Panel Position");

	private static readonly MOVE_TO_RIGHT_LABEL = nls.localize('moveToRight', "Move Panel Right");
	private static readonly MOVE_TO_BOTTOM_LABEL = nls.localize('moveToBottom', "Move Panel to Bottom");

	private toDispose: IDisposable[];

	constructor(
		id: string,
		label: string,
		@IPartService private partService: IPartService,
	) {
		super(id, label, partService.getPanelPosition() === Position.RIGHT ? 'move-panel-to-bottom' : 'move-panel-to-right');
		this.toDispose = [];
		const setClassAndLabel = () => {
			const positionRight = this.partService.getPanelPosition() === Position.RIGHT;
			this.class = positionRight ? 'move-panel-to-bottom' : 'move-panel-to-right';
			this.label = positionRight ? TogglePanelPositionAction.MOVE_TO_BOTTOM_LABEL : TogglePanelPositionAction.MOVE_TO_RIGHT_LABEL;
		};
		this.toDispose.push(partService.onEditorLayout(() => setClassAndLabel()));
		setClassAndLabel();
	}

	run(): TPromise<any> {
		const position = this.partService.getPanelPosition();
		return this.partService.setPanelPosition(position === Position.BOTTOM ? Position.RIGHT : Position.BOTTOM);
	}

	dispose(): void {
		super.dispose();
		this.toDispose = dispose(this.toDispose);
	}
}

export class ToggleMaximizedPanelAction extends Action {

	static readonly ID = 'workbench.action.toggleMaximizedPanel';
	static readonly LABEL = nls.localize('toggleMaximizedPanel', "Toggle Maximized Panel");

	private static readonly MAXIMIZE_LABEL = nls.localize('maximizePanel', "Maximize Panel Size");
	private static readonly RESTORE_LABEL = nls.localize('minimizePanel', "Restore Panel Size");

	private toDispose: IDisposable[];

	constructor(
		id: string,
		label: string,
		@IPartService private partService: IPartService
	) {
		super(id, label, partService.isPanelMaximized() ? 'minimize-panel-action' : 'maximize-panel-action');
		this.toDispose = [];
		this.toDispose.push(partService.onEditorLayout(() => {
			const maximized = this.partService.isPanelMaximized();
			this.class = maximized ? 'minimize-panel-action' : 'maximize-panel-action';
			this.label = maximized ? ToggleMaximizedPanelAction.RESTORE_LABEL : ToggleMaximizedPanelAction.MAXIMIZE_LABEL;
		}));
	}

	run(): TPromise<any> {
		const thenable: Thenable<void> = !this.partService.isVisible(Parts.PANEL_PART) ? this.partService.setPanelHidden(false) : Promise.resolve(null);
		return thenable.then(() => this.partService.toggleMaximizedPanel());
	}

	dispose(): void {
		super.dispose();
		this.toDispose = dispose(this.toDispose);
	}
}

export class PanelActivityAction extends ActivityAction {

	constructor(
		activity: IActivity,
		@IPanelService private panelService: IPanelService
	) {
		super(activity);
	}

	run(event: any): TPromise<any> {
		return this.panelService.openPanel(this.activity.id, true).then(() => this.activate());
	}
}

const actionRegistry = Registry.as<IWorkbenchActionRegistry>(WorkbenchExtensions.WorkbenchActions);
actionRegistry.registerWorkbenchAction(new SyncActionDescriptor(TogglePanelAction, TogglePanelAction.ID, TogglePanelAction.LABEL, { primary: KeyMod.CtrlCmd | KeyCode.KEY_J }), 'View: Toggle Panel', nls.localize('view', "View"));
actionRegistry.registerWorkbenchAction(new SyncActionDescriptor(FocusPanelAction, FocusPanelAction.ID, FocusPanelAction.LABEL), 'View: Focus into Panel', nls.localize('view', "View"));
actionRegistry.registerWorkbenchAction(new SyncActionDescriptor(ToggleMaximizedPanelAction, ToggleMaximizedPanelAction.ID, ToggleMaximizedPanelAction.LABEL), 'View: Toggle Maximized Panel', nls.localize('view', "View"));
actionRegistry.registerWorkbenchAction(new SyncActionDescriptor(ClosePanelAction, ClosePanelAction.ID, ClosePanelAction.LABEL), 'View: Close Panel', nls.localize('view', "View"));
actionRegistry.registerWorkbenchAction(new SyncActionDescriptor(TogglePanelPositionAction, TogglePanelPositionAction.ID, TogglePanelPositionAction.LABEL), 'View: Toggle Panel Position', nls.localize('view', "View"));
actionRegistry.registerWorkbenchAction(new SyncActionDescriptor(ToggleMaximizedPanelAction, ToggleMaximizedPanelAction.ID, undefined), 'View: Toggle Panel Position', nls.localize('view', "View"));

MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	group: '2_workbench_layout',
	command: {
		id: TogglePanelAction.ID,
		title: nls.localize({ key: 'miTogglePanel', comment: ['&& denotes a mnemonic'] }, "Toggle &&Panel")
	},
	order: 5
});

MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	group: '2_workbench_layout',
	command: {
		id: TogglePanelPositionAction.ID,
		title: TogglePanelPositionAction.LABEL
	},
	order: 3
});
