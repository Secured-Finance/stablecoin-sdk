import { configure } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { DisposableWalletProvider } from "./testUtils/DisposableWalletProvider";

// Loading the protocol store takes longer without Multicall
configure({ asyncUtilTimeout: 5000 });

const ethereum = new DisposableWalletProvider(
  "http://localhost:8545",
  "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
);

// Inject DisposableWalletProvider as window.ethereum
Object.assign(window, { ethereum });

// ConnectKit uses ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));
