import type { APIRoute } from "astro";
import { MY_LINKS } from "../../consts";


export const getStaticPaths = () => {
  return MY_LINKS.map(link => ({ params: { id: link.shortenUrl }}))
}

export const GET: APIRoute = ({ params, redirect }) => {
  const targetLink = MY_LINKS.find(link => link.shortenUrl === params.id)! // it's okay cuz it's statis paths

  return redirect(targetLink.url, 307);
}
