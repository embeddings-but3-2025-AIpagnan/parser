import os
from PIL import Image
import math

def moyenne_couleur_sans_transparence(image_path):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        pixels = list(img.getdata())

        total_r = total_g = total_b = 0
        count = 0

        for r, g, b, a in pixels:
            if a != 0: 
                total_r += r
                total_g += g
                total_b += b
                count += 1

        if count == 0:
            return (0, 0, 0)  

        return (total_r // count, total_g // count, total_b // count)

def creer_et_redimensionner_image(image_path, nom_sortie, pixel_max=30, dossier_sortie="./output"):
    os.makedirs(dossier_sortie, exist_ok=True)

    with Image.open(image_path) as img:
        largeur, hauteur = img.size
        max_dim = max(largeur, hauteur)

        ratio = pixel_max / max_dim
        nouvelle_largeur = int(largeur * ratio)
        nouvelle_hauteur = int(hauteur * ratio)

        img_redim = img.resize((nouvelle_largeur, nouvelle_hauteur), Image.LANCZOS)

    if isinstance(nom_sortie, str):
        nom_fichier = f"{nom_sortie}.png"
    else:
        nom_fichier = f"{nom_sortie[0]}_{nom_sortie[1]}_{nom_sortie[2]}.png"

    chemin_sortie = os.path.join(dossier_sortie, nom_fichier)

    img_redim.save(chemin_sortie)
    print(f"Image créée : {chemin_sortie}")

def traiter_images_png(dossier="./source",taille=30):
    images = []
    for nom_fichier in os.listdir(dossier):
        if nom_fichier.lower().endswith(".png"):
            chemin_image = os.path.join(dossier, nom_fichier)
            moyenne = moyenne_couleur_sans_transparence(chemin_image)
            images.append([moyenne,None])
            creer_et_redimensionner_image(chemin_image, moyenne,taille)
    return images

def creer_image_et_ajouter(images,ratio):
    try:
        images_source=[]

        source = Image.open("source.png")
        source_width, source_height = source.size

     
        new_width = source_width * ratio
        new_height = source_height * ratio

        new_image = Image.new("RGBA", (new_width, new_height), (255, 255, 255, 255))
        for y in range(source_height):
            for x in range(source_width):
                couleur = source.getpixel((x, y))
                indice=chercher_couleur(images, couleur)
                if images[indice][1] is None:
                    images_source.append(Image.open(f"./output/{images[indice][0][0]}_{images[indice][0][1]}_{images[indice][0][2]}.png").convert("RGBA"))  
                    images[indice][1] = len(images_source) - 1
                correct_image= images_source[images[indice][1]]
                new_image.paste(correct_image, (x*ratio, y*ratio), correct_image)
                


        new_image.save("output.png")
        print("Image créée et enregistrée sous 'output.png'")
        source.close()
        os.remove("source.png")

    except FileNotFoundError as e:
        print(f"Erreur : {e}")

def chercher_couleur(images, couleur):
    distance=[]
    for i in images:
        distance.append(math.sqrt((i[0][0] - couleur[0]) ** 2 + ((i[0][1] - couleur[1]) ** 2) + ((i[0][2] - couleur[2]) ** 2)))
    min=1000
    indice=-1
    for i in range(len(distance)):
        if distance[i]<min:
            min=distance[i]
            indice=i
    return indice


if __name__ == "__main__":
    images_size = int(input("Entrez la taille des images (en pixels, par exemple 100) : "))
    images=traiter_images_png("./source",images_size)
    image_source=input("Entrez le nom de l'image source : ")
    if image_source.lower().endswith(".png") or image_source.lower().endswith(".jpg") or image_source.lower().endswith(".jpeg"):
        source_size = int(input("Entrez la taille de l'image source (en pixels, par exemple 100) : "))
        creer_et_redimensionner_image(image_source,"source",source_size,".")
        ratio=int(input("Combien de fois l'image de sortie sera-t-elle plus grande : "))
        creer_image_et_ajouter(images,ratio)
    else:
        print("Le fichier source n'est pas une image valide.")
