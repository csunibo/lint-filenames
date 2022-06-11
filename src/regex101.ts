interface Response {
  permalinkFragment: string
  version: number
}

export const regexURL = async (regex: string, failedFiles: string[]) => {
  const req = await fetch('https://regex101.com/api/regex', {
    method: 'POST', body: JSON.stringify({
      flavor: 'javscript',
      delimiter: '/',
      flags: 'gm',
      regex
    })
  });
  const { permalinkFragment, version } = await req.json() as Response;
  return `https://regex101.com/r/${permalinkFragment}/${version}`
}
