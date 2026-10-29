import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import App from "@/App";

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return user;
}

const promptBox = () => screen.getByRole("textbox", { name: "Your prompt" });
const replyBox = () => screen.getByRole("textbox", { name: "AI reply" });
const safePrompt = () => screen.getByRole("region", { name: "Safe prompt text" });
const restored = () => screen.getByRole("region", { name: "Restored reply text" });

beforeEach(() => {
  // The async clipboard needs a secure context; jsdom reports none.
  Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
});

describe("redact view", () => {
  test("redacts as you type and lets you keep a value", async () => {
    const user = setup();
    await user.click(promptBox());
    await user.paste("Mail bob@example.com or call from 203.0.113.10 today");

    expect(within(safePrompt()).getByRole("button", { name: "[EMAIL_1]" })).toHaveAttribute("aria-pressed", "true");
    expect(within(safePrompt()).getByRole("button", { name: "[IPV4_1]" })).toBeInTheDocument();
    expect(screen.getByText("2 redacted")).toBeInTheDocument();

    await user.click(within(safePrompt()).getByRole("button", { name: "[EMAIL_1]" }));
    const kept = within(safePrompt()).getByRole("button", { name: "bob@example.com" });
    expect(kept).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("1 redacted")).toBeInTheDocument();

    await user.click(kept);
    expect(within(safePrompt()).getByRole("button", { name: "[EMAIL_1]" })).toBeInTheDocument();
  });

  test("adds an always-redact term and removes it again", async () => {
    const user = setup();
    await user.click(promptBox());
    await user.paste("Ask Dogban about it");
    expect(within(safePrompt()).queryByRole("button")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Term to redact"), "Dogban");
    await user.selectOptions(screen.getByLabelText("Type"), "ORG");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(within(safePrompt()).getByRole("button", { name: "[ORG_1]" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Dogban" }));
    expect(within(safePrompt()).queryByRole("button")).not.toBeInTheDocument();
  });

  test("a detector can be switched off and findings can be kept in bulk", async () => {
    const user = setup();
    await user.click(promptBox());
    await user.paste("bob@example.com and 203.0.113.10");
    expect(screen.getByText("2 redacted")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Contact details/ }));
    expect(screen.getByText("1 redacted")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep all" }));
    expect(screen.getByText("0 redacted")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Redact all" }));
    expect(screen.getByText("1 redacted")).toBeInTheDocument();
  });

  test("Redact selection files the selected text under the chosen type", async () => {
    const user = setup();
    await user.click(promptBox());
    await user.paste("Project Narra ships soon");
    const box = promptBox() as HTMLTextAreaElement;
    box.setSelectionRange(0, 13);
    fireEvent.select(box);

    await user.click(screen.getByRole("button", { name: "Redact selection" }));
    expect(within(safePrompt()).getByRole("button", { name: "[CUSTOM_1]" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent('Added "Project Narra" as Other');
  });

  test("the sample is only offered on an empty prompt, and Clear can be undone", async () => {
    const user = setup();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Load sample prompt" }));
    expect((promptBox() as HTMLTextAreaElement).value).toContain("Juan Dela Cruz");
    expect(within(safePrompt()).getAllByRole("button").length).toBeGreaterThan(20);
    expect(screen.queryByRole("button", { name: "Load sample prompt" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect((promptBox() as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByText(/redacted prompt appears here/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect((promptBox() as HTMLTextAreaElement).value).toContain("Juan Dela Cruz");
  });

  test("copying records the placeholder map and says what was copied", async () => {
    const user = setup();
    await user.click(promptBox());
    await user.paste("bob@example.com");
    await user.click(screen.getByRole("button", { name: "Copy safe prompt" }));

    expect(await navigator.clipboard.readText()).toBe("[EMAIL_1]");
    expect(screen.getByRole("status")).toHaveTextContent("Safe prompt copied. 1 value redacted.");
  });

  test("paused live mode for huge input, then Redact now", async () => {
    const user = setup();
    fireEvent.change(promptBox(), { target: { value: `bob@example.com ${"a".repeat(400_001)}` } });
    expect(screen.getByText(/Large input: live updates paused/)).toBeInTheDocument();
    expect(screen.getByText("0 redacted")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Redact now" }));
    expect(within(safePrompt()).getByRole("button", { name: "[EMAIL_1]" })).toBeInTheDocument();
  });

  test("remembering preferences saves terms but never prompt text", async () => {
    const user = setup();
    await user.click(screen.getByRole("switch"));
    await user.type(screen.getByLabelText("Term to redact"), "Dogban");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(promptBox());
    await user.paste("secret prompt text");

    const saved = window.localStorage.getItem("redactor:prefs:v1") ?? "";
    expect(JSON.parse(saved)).toMatchObject({ remember: true, terms: [{ value: "Dogban" }] });
    expect(saved).not.toContain("secret prompt text");

    await user.click(screen.getByRole("switch"));
    expect(window.localStorage.getItem("redactor:prefs:v1")).toBeNull();
  });
});

describe("restore view", () => {
  async function toRestoreWithReply(user: ReturnType<typeof userEvent.setup>, reply: string) {
    await user.click(promptBox());
    await user.paste("Mail bob@example.com or call 203.0.113.10");
    await user.click(screen.getByRole("button", { name: "Copy safe prompt" }));
    await user.click(screen.getByRole("tab", { name: /Restore/ }));
    await user.click(replyBox());
    await user.paste(reply);
  }

  test("restores values, flags unknown tokens, and toggles a value back to its placeholder", async () => {
    const user = setup();
    await toRestoreWithReply(user, "Ping [EMAIL_1], host [IPV4_1], also [NOPE_9] and [EMAIL_1] again.");

    expect(screen.getAllByRole("button", { name: "bob@example.com" })).toHaveLength(2);
    expect(within(restored()).getByRole("button", { name: "203.0.113.10" })).toBeInTheDocument();
    expect(screen.getByText("3 restored")).toBeInTheDocument();
    expect(screen.getByText(/1 token not found in this session's map: \[NOPE_9\]/)).toBeInTheDocument();

    // One click flips every occurrence of that token.
    await user.click(screen.getAllByRole("button", { name: "bob@example.com" })[0]);
    expect(within(restored()).getAllByRole("button", { name: "[EMAIL_1]" })).toHaveLength(2);
    expect(within(restored()).getAllByRole("button", { name: "[EMAIL_1]" })[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("1 restored · 2 redacted")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy restored" }));
    expect(await navigator.clipboard.readText()).toBe("Ping [EMAIL_1], host 203.0.113.10, also [NOPE_9] and [EMAIL_1] again.");

    await user.click(within(restored()).getAllByRole("button", { name: "[EMAIL_1]" })[0]);
    expect(screen.getByText("3 restored")).toBeInTheDocument();
  });

  test("hovering a restored value highlights its token in the reply, and the reverse", async () => {
    const user = setup();
    await toRestoreWithReply(user, "Host [IPV4_1] ok");
    const marks = () => document.querySelectorAll(".editor__backdrop mark");
    expect(marks()).toHaveLength(1);
    expect(marks()[0]).toHaveTextContent("[IPV4_1]");
    expect(marks()[0]).not.toHaveClass("hl--active");

    await user.hover(within(restored()).getByRole("button", { name: "203.0.113.10" }));
    expect(marks()[0]).toHaveClass("hl--active");
    await user.unhover(within(restored()).getByRole("button", { name: "203.0.113.10" }));
    expect(marks()[0]).not.toHaveClass("hl--active");
  });

  test("a choice to keep a value redacted is dropped when the reply is cleared", async () => {
    const user = setup();
    await toRestoreWithReply(user, "Ping [EMAIL_1]");
    await user.click(within(restored()).getByRole("button", { name: "bob@example.com" }));
    expect(within(restored()).getByRole("button", { name: "[EMAIL_1]" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(replyBox());
    await user.paste("Again [EMAIL_1]");
    expect(within(restored()).getByRole("button", { name: "bob@example.com" })).toHaveAttribute("aria-pressed", "true");
  });

  test("tells you to redact first when there is no placeholder map yet", async () => {
    const user = setup();
    await user.click(screen.getByRole("tab", { name: /Restore/ }));
    expect(screen.getByText(/Redact and copy a prompt first/)).toBeInTheDocument();
  });

  test("Ctrl+Enter copies the result on screen", async () => {
    const user = setup();
    await toRestoreWithReply(user, "Ping [EMAIL_1]");
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(await navigator.clipboard.readText()).toBe("Ping bob@example.com");
  });
});

describe("chrome", () => {
  test("the theme toggle flips data-theme and remembers the choice", async () => {
    const user = setup();
    document.documentElement.dataset.theme = "dark";
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("redactor:theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  test("Help opens a popover and closes on Escape", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByText("How it works")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("How it works")).not.toBeInTheDocument();
  });

  test("the splitter moves with the keyboard and resets on double click", async () => {
    const user = setup();
    const splitter = screen.getByRole("separator");
    expect(splitter).toHaveAttribute("aria-valuenow", "50");
    splitter.focus();
    await user.keyboard("{ArrowRight}");
    expect(splitter).toHaveAttribute("aria-valuenow", "52");
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(splitter).toHaveAttribute("aria-valuenow", "42");
    await user.keyboard("{Home}");
    expect(splitter).toHaveAttribute("aria-valuenow", "25");
    await user.dblClick(splitter);
    expect(splitter).toHaveAttribute("aria-valuenow", "50");
  });
});

describe("settings import", () => {
  const settingsFile = (body: unknown) => new File([JSON.stringify(body)], "settings.json", { type: "application/json" });

  test("adds the file's terms and detector toggles", async () => {
    const user = setup();
    await user.upload(
      screen.getByLabelText("Settings file to import"),
      settingsFile({ format: "redactor-config", version: 1, terms: [{ value: "Acme Corp", entity: "ORG" }, { value: "bad‮" }], enabledCategories: ["secrets"] })
    );
    expect(await screen.findByRole("button", { name: "Remove Acme Corp" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Imported 1 term and detector settings. 1 entry skipped");
    expect(screen.getByRole("checkbox", { name: /Contact details/ })).not.toBeChecked();

    await user.click(promptBox());
    await user.paste("Ask Acme Corp");
    expect(within(safePrompt()).getByRole("button", { name: "[ORG_1]" })).toBeInTheDocument();
  });

  test("rejects a file that isn't a settings export without changing anything", async () => {
    const user = setup();
    await user.upload(screen.getByLabelText("Settings file to import"), settingsFile({ terms: [{ value: "Acme" }] }));
    expect(await screen.findByText("That file isn't a Redactor settings export.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Acme" })).not.toBeInTheDocument();
  });
});

test("removing a term hands focus to the next row's remove button", async () => {
  const user = setup();
  const input = screen.getByPlaceholderText("Name or company");
  await user.type(input, "Acme{Enter}");
  await user.type(input, "Globex{Enter}");
  await user.click(screen.getByRole("button", { name: "Remove Acme" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Remove Globex" })).toHaveFocus());
  await user.click(screen.getByRole("button", { name: "Remove Globex" }));
  await waitFor(() => expect(input).toHaveFocus());
});

test("an Other term can be given its own token name", async () => {
  const user = setup();
  await user.type(screen.getByLabelText("Token name (optional)"), "Ticket ID");
  expect(screen.getByText("9/20")).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText("Name or company"), "ABC-123{Enter}");
  await user.click(promptBox());
  await user.paste("See ABC-123");
  expect(within(safePrompt()).getByRole("button", { name: "[TICKET_ID_1]" })).toBeInTheDocument();
});

describe("narrow screens", () => {
  beforeEach(() => {
    // Below the lg breakpoint: one pane at a time.
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {}
    })) as unknown as typeof window.matchMedia;
  });

  test("panes switch through tabs and the splitter is gone", async () => {
    const user = setup();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Your prompt" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Safe prompt text" })).not.toBeInTheDocument();

    await user.click(promptBox());
    await user.paste("bob@example.com");
    await user.click(screen.getByRole("tab", { name: /Review/ }));
    expect(screen.getByText("Always redact")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Review/ })).toHaveTextContent("1");

    await user.click(screen.getByRole("tab", { name: "Safe prompt" }));
    expect(within(safePrompt()).getByRole("button", { name: "[EMAIL_1]" })).toBeInTheDocument();
  });
});

test("toasts disappear on their own", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(promptBox());
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(screen.getByRole("status")).toHaveTextContent("Nothing to copy yet.");
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  } finally {
    vi.useRealTimers();
  }
});
