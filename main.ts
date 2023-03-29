import { App, Editor, MarkdownView, Plugin, TFile, Setting, PluginSettingTab, PaneType } from 'obsidian';

interface Settings {
    paneType: PaneType;
}

const DEFAULT_SETTINGS: Settings = {
    paneType: 'tab'
}

export default class SelectOpenPlugIn extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: 'select-open-links',
			name: 'Select Open Links',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.selectOpenTexts(view)
			}
		});
	}

	selectOpenTexts(view: MarkdownView) {
		var files = this.getFilesName(view);

		files.forEach((fileName) => {
			if(fileName) this.app.workspace.openLinkText(fileName, "", this.settings.paneType, {active: false})
		})
	}
		
	// https://github.com/mrjackphil/obsidian-crosslink-between-notes
	getFilesName(view: MarkdownView) {
		const cm = view.editor
        const cursor = cm.getCursor()
        const selectedRange = cm.getSelection()
        const line = selectedRange || cm.getLine(cursor.line)

        const regexpWiki = /\[\[.+?]]/gi
        const linksWiki = line.match(regexpWiki) || []

        const ar = [linksWiki].filter(e => e.length)

        return ar.flat().map((lnk) => {
            const wikiName = lnk
                .replace(/(\[\[|]])/g, '')
                .replace(/\|.+/, '')
                .replace(/#.+/, '')

            return wikiName
        })
	}

	getFilesFromLineOrSelection(view: MarkdownView): TFile[] {
        const cm = view.editor
        const cursor = cm.getCursor()
        const selectedRange = cm.getSelection()
        const line = selectedRange || cm.getLine(cursor.line)

        const regexpWiki = /\[\[.+?]]/gi
        const linksWiki = line.match(regexpWiki) || []
        const ar = [linksWiki].filter(e => e.length)

        return ar.flat().map((lnk) => {
            const wikiName = lnk
                .replace(/(\[\[|]])/g, '')
                .replace(/\|.+/, '')
                .replace(/#.+/, '')
			
            return this.getFilesByName(wikiName)
        })
    }

	getFilesByName(name: string | string[]) {
        const files = this.app.vault.getFiles()

        if (Array.isArray(name)) {
            return files.filter(e => name.includes(e.name)
                || name.includes((e.path))
                || name.includes(e.basename)
            )[0]
        }

        return files.filter(e => e.name === name
            || e.path === name
            || e.basename === name
        )[0]
    }

	onunload() {

	}

	async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
    plugin: SelectOpenPlugIn;

    constructor(app: App, plugin: SelectOpenPlugIn) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let {containerEl} = this;

        containerEl.empty();
        containerEl.createEl('h2', {text: 'Settings for "Add links to the current note" plugin'});
		
		new Setting(containerEl)
			.setName('Select Openning links method')
			.addDropdown(dropDown => {
				dropDown.addOption('tab', 'Tab');
				dropDown.addOption('window', 'Window');
				dropDown.addOption('split', 'Split');
				dropDown.onChange(async (value) =>	{
					this.plugin.settings.paneType = (value as PaneType);
					await this.plugin.saveSettings();
				});
			});
    }
}
