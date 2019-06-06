package com.example.Crawler;

import java.io.IOException;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class Crawler {
    public static void main(String[] args) {
        try {
            processPage("http://born2kill.clan.su/publ/");
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    public static void processPage(String URL) throws IOException {
        try {
            Document doc = Jsoup.connect(URL).get();
            Elements targetPages = doc.select("a[href]");
            Boolean flag = false;

            for (Element link : targetPages) {
                String text = link.text();
                String href = link.attr("href");
                if (link.text().contains("Первичные ресурсы")) {
                    flag = true;
                } else if (link.text().contains("Аптека")) {
                    flag = false;
                }

                if(flag) {
                    if(href.contains("ganja_island") && href.contains("-")){
                        try {
                            Thread.sleep(2000);
                        } catch (InterruptedException ie) {
                            //Handle exception
                        }
                        processTargetPage(link.attr("abs:href"));
                    } else if(!href.contains("-") && !href.contains("ganja_island") && !href.contains("z_lands_island")) {
                        System.out.println("//" + link.text());
                    }
                }
            }
        } catch (IOException e1) {
            e1.printStackTrace();
        }
    }

    public static void processTargetPage(String URL) {
        File dir = new File(".");
        String loc = "";
        try {
            loc = dir.getCanonicalPath() + File.separator + "record.txt";
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        Document doc;
        try {
            doc = Jsoup.connect(URL).get();
        } catch (IOException e1) {
            e1.printStackTrace();
            return;
        }

        //Parse
        Element tab =  doc.getElementsByTag("tbody").get(22);
        String wildString = tab.text();
        List<String> wildList = Arrays.asList(wildString.split(" "));

        List<String> resourceNames = Arrays.asList(
                "часы",
                "Мощность",
                "Уран",
                "Бокситы",
                "соломка",
                "Трава",
                "Ганджиум",
                "Сталь",
                "Алюминий"
        );

        List<String> resourceFields = Arrays.asList(
                "hours",
                "power",
                "uranium",
                "boxites",
                "solomka",
                "grass",
                "ganjium",
                "steel",
                "aluminium"
        );

        //Get name
        int startIndex = doc.location().indexOf("ganja_island")+ 13;
        String partial = doc.location().substring(startIndex);
        int endIndex = partial.indexOf("/");
        String name = partial.substring(0, endIndex);

        String finalString = "{name:" + name +", ";
        for(int i = 0; i < resourceNames.size(); i++){
            int index = wildList.indexOf(resourceNames.get(i));
            if(index != -1){
                String result = wildList.get(index+1);
                finalString += resourceFields.get(i) + ":" + result + ", ";
            }
        }
        finalString = finalString.substring(0, finalString.length()-2) + "}";

        System.out.println(finalString);
    }
}
