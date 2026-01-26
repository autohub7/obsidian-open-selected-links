import { App, Editor, MarkdownView, Plugin, TFile, Setting, PluginSettingTab, PaneType } from 'obsidian';

interface Settings {
    paneType: PaneType;
}

const DEFAULT_SETTINGS: Settings = {
    paneType: 'tab'
};

type OpenItem =
    | { type: 'file'; name: string }
    | { type: 'url'; url: string };

export default class SelectOpenPlugIn extends Plugin {
    settings: Settings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new SettingTab(this.app, this));

        this.addCommand({
            id: 'select-open-links',
            name: 'Select Open Links',
            editorCallback: (_editor: Editor, view: MarkdownView) => {
                this.selectOpenTexts(view);
            }
        });
    }

    selectOpenTexts(view: MarkdownView) {
        const items = this.getItemsToOpen(view);

        items.forEach((item) => {
            if (item.type === 'file') {
                // item.name is recognized
                this.app.workspace.openLinkText(item.name, "", this.settings.paneType, { active: false });
            } else {
                // item.url is recognized
                window.open(item.url, '_blank');
            }
        });
    }

    getItemsToOpen(view: MarkdownView): OpenItem[] {
        const cm = view.editor;
        const cursor = cm.getCursor();
        const selectedRange = cm.getSelection();
        const line = selectedRange || cm.getLine(cursor.line);

        const regexpWiki = /\[\[.+?]]/gi;
        const regexpUrl = /https?:\/\/[^\s\]]+(?=\))?/gi;

        const linksWiki = line.match(regexpWiki) || [];
        const linksUrl = line.match(regexpUrl) || [];

        const wikiItems: OpenItem[] = linksWiki.map((link) => ({
            type: 'file',
            name: link.replace(/(\[\[|]])/g, '').replace(/\|.+/, '').replace(/#.+/, '')
        }));

        const urlItems: OpenItem[] = linksUrl.map((url) => ({
            type: 'url',
            url: url.endsWith(')') ? url.slice(0, -1) : url
        }));

        return [...wikiItems, ...urlItems];
    }

    getFilesFromLineOrSelection(view: MarkdownView): TFile[] {
        const items = this.getItemsToOpen(view);

        return items
            .filter((item): item is { type: 'file'; name: string } => item.type === 'file')
            .map((item) => this.getFilesByName(item.name))
            .filter((file): file is TFile => file !== undefined);
    }

    getFilesByName(name: string | string[]) {
        const files = this.app.vault.getFiles();

        if (Array.isArray(name)) {
            return files.filter(e =>
                name.includes(e.name) ||
                name.includes(e.path) ||
                name.includes(e.basename)
            )[0];
        }

        return files.filter(e =>
            e.name === name ||
            e.path === name ||
            e.basename === name
        )[0];
    }

    onunload() {}

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
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Open Selected Links plugin' });

        new Setting(containerEl)
            .setName('Select a procedure of opening a linked document')
            .addDropdown(dropDown => {
                dropDown.addOption('tab', 'Tab');
                dropDown.addOption('window', 'Window');
                dropDown.addOption('split', 'Split');
                dropDown.setValue(this.plugin.settings.paneType);
                dropDown.onChange(async (value) => {
                    this.plugin.settings.paneType = (value as PaneType);
                    await this.plugin.saveSettings();
                });
            });
    }
}