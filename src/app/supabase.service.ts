import { Injectable } from '@angular/core'
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient
} from '@supabase/supabase-js'
import { environment } from '../../environment'

export interface Asiakas {
  asiakasnro: number
  sukunimi: string
  etunimi: string
  katuosoite: string
  postinro: string
  postitmp: string
  puh: string
}

export interface Nide {
  nide_id : number
  teos_id : number
  tyyppi : string
  lainaaika_vrk : number
}

export interface Teos {
  teos_id : number
  luokka : string
  kirjoittaja : string
  nimike : string
}

export interface Lainaus {
  id? : string
  teos_id : number
  nide_id : number
  asiakasnro : number
  erapaiva : Date
  palautuspv : any
  luokka : string
  kirjoittaja : string
  nimi : string
  tyyppi : string
  myohassa? : string
}



@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient
  _session: AuthSession | null = null

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session
    })
    return this._session
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  async getAsiakkaat() {
    const { data: asiakkaat, error } = await this.supabase.from('asiakkaat').select('*').limit(10)
    return { asiakkaat, error }
  }

  async etsiAsiakas(nro : string) {
    const { data : asiakas, error } = await this.supabase.from('asiakkaat').select('*').eq('asiakasnro', Number(nro))
    return {asiakas, error }
  }

  async haeNide(nro : string) {
    const { data : nide, error } = await this.supabase.from('niteet').select('*').eq('nide_id',Number(nro))
    return {nide,error}
  }

  async haeTeos(nro : number) {
    const { data : teos, error } = await this.supabase.from('teokset').select('*').eq('teos_id', nro)
    return {teos,error}
  }

  async Lainaa(lainaus : Lainaus[]) {
    const { error } = await this.supabase.from('lainaukset').insert(lainaus)
  }

  // getChanges() {

  //     this.supabase.channel('schema-db-changes')
  //       .on('postgres_changes',
  //         {
  //           event:'*',
  //           schema: 'public'
  //         },
  //         (payload) => console.log(payload)
  //         )
  //         .subscribe()

  // }

  async muokkaaPalautus(nide : number) {
    const { error } = await this.supabase.from('lainaukset').update({palautuspv : new Date()}).eq('nide_id', nide)
  }

  async haeLaina(nro : number) {
    const { data:laina, error } = await this.supabase.from('lainaukset').select('*').eq('nide_id', nro)
    return { laina, error }
  }

  async getLainat(nro : number) {
    const { data: lainat, error } = await this.supabase.from('lainaukset').select('*').eq('asiakasnro', nro)
    return { lainat, error }
  }

  async muokkaaKayttaja(muokattava : any, asiakasnro : number) {
    const { error } = await this.supabase.from('asiakkaat').update(muokattava).eq('asiakasnro', asiakasnro)
    console.log(error)
  }
}
