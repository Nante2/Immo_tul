import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, test, expect, beforeEach } from "vitest";

// On simule le contexte d'authentification
const mockLogin = vi.fn();
let mockAuth = {};

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

// On simule le hook qui change le titre de la page
vi.mock("../../hooks/usePageTitle", () => ({
  usePageTitle: () => {},
}));

import Login from "./Login";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <Login />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockLogin.mockReset();
  mockAuth = { user: null, login: mockLogin, sessionExpired: false };
});

describe("Page de connexion admin", () => {
  test("affiche le formulaire", () => {
    renderLogin();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  test("appelle login avec l'email et le mot de passe saisis", async () => {
    mockLogin.mockResolvedValue({});
    renderLogin();

    await userEvent.type(screen.getByLabelText("Email"), "admin@test.com");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(mockLogin).toHaveBeenCalledWith("admin@test.com", "secret123");
  });

  test("affiche l'erreur si la connexion échoue", async () => {
    mockLogin.mockRejectedValue(new Error("Identifiants incorrects"));
    renderLogin();

    await userEvent.type(screen.getByLabelText("Email"), "admin@test.com");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Identifiants incorrects");
    });
  });

  test("le bouton oeil affiche puis masque le mot de passe", async () => {
    renderLogin();
    const champ = screen.getByLabelText("Mot de passe");
    expect(champ).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(champ).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
    expect(champ).toHaveAttribute("type", "password");
  });

  test("affiche le message de session expirée", () => {
    mockAuth = { user: null, login: mockLogin, sessionExpired: true };
    renderLogin();
    expect(screen.getByRole("status")).toHaveTextContent("Votre session a expiré");
  });

  test("redirige si l'utilisateur est déjà connecté", () => {
    mockAuth = { user: { email: "admin@test.com" }, login: mockLogin, sessionExpired: false };
    renderLogin();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });
});
