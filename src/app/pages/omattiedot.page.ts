import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Asiakas, SupabaseService } from '../supabase.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-omasivu',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl : './kirjautuminen.page.html',
  styles: [
    `
     
    `,
  ],
})

export default class OmaSivuComponent {
  
asiakkaat: Asiakas[] = [];
  asiakas : Asiakas | undefined;
  virhe : string = "";
  kortinNumero = '';


  constructor(private api: SupabaseService, private router: Router, private ngZone : NgZone, private changeDetection: ChangeDetectorRef) {}
  
  lainausForm = new FormGroup({
    kirjastokortti : new FormControl('')
  })

  ngOnChanges() : void {
    this.virhe
}

  goTo(comp : any, param : any) {
    this.ngZone.run(() => {
      this.router.navigate([comp, param])
    })
  }

  async submit() {
    this.kortinNumero = (this.lainausForm.value.kirjastokortti ?? ``)
    if (this.kortinNumero) {

      await this.api.etsiAsiakas(this.kortinNumero)
      
      
      .catch(error => this.virhe = error)
      
      .then(asiakas => this.asiakas = asiakas.asiakas[0])
      
    }
    if (this.asiakas) {
      this.goTo('/omatTiedot', this.kortinNumero)
    }
    else {
        this.virhe = "Kirjastokortin numero virheellinen."
    }
    this.changeDetection.detectChanges(); 
      
    }

}
