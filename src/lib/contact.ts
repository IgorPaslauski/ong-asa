/** Canal oficial de contato da associação (WhatsApp) com mensagem pré-preenchida. */
export function whatsapp(message: string) {
  return `https://wa.me/5555991349705?text=${encodeURIComponent(message)}`
}
